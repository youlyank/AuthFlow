import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Shield, CheckCircle, Clock, MapPin, Monitor } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";

interface SecurityEvent {
  id: string;
  userId: string | null;
  type: string;
  riskScore: number;
  details: any;
  ipAddress: string | null;
  location: string | null;
  resolved: boolean;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  createdAt: Date;
}

export default function SecurityEventsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"unresolved" | "resolved" | "all">("unresolved");

  // Fetch security events
  const { data: events = [], isLoading } = useQuery<SecurityEvent[]>({
    queryKey: ["/api/security-events"],
  });

  // Resolve event mutation
  const resolveEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return apiRequest("POST", `/api/security-events/${eventId}/resolve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/security-events"] });
      toast({
        title: "Event Resolved",
        description: "Security event has been marked as resolved",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to resolve event",
      });
    },
  });

  // Filter events based on active tab
  const filteredEvents = events.filter((event) => {
    if (activeTab === "unresolved") return !event.resolved;
    if (activeTab === "resolved") return event.resolved;
    return true;
  });

  // Get severity based on risk score
  const getSeverityBadge = (riskScore: number) => {
    if (riskScore >= 70) {
      return <Badge variant="destructive" data-testid={`badge-severity-high`}>High Risk</Badge>;
    } else if (riskScore >= 40) {
      return <Badge variant="default" className="bg-orange-600" data-testid={`badge-severity-medium`}>Medium Risk</Badge>;
    } else {
      return <Badge variant="secondary" data-testid={`badge-severity-low`}>Low Risk</Badge>;
    }
  };

  // Format event type for display
  const formatEventType = (type: string) => {
    return type.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="heading-security-events">
          <Shield className="w-8 h-8" />
          Security Events
        </h1>
        <p className="text-muted-foreground">Monitor and manage security events and threats</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="unresolved" data-testid="tab-unresolved">
            Unresolved ({events.filter(e => !e.resolved).length})
          </TabsTrigger>
          <TabsTrigger value="resolved" data-testid="tab-resolved">
            Resolved ({events.filter(e => e.resolved).length})
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">
            All ({events.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Loading events...</p>
              </CardContent>
            </Card>
          ) : filteredEvents.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-4" />
                  <p className="text-muted-foreground">
                    {activeTab === "unresolved" 
                      ? "No unresolved security events" 
                      : activeTab === "resolved"
                      ? "No resolved security events"
                      : "No security events yet"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <Card key={event.id} data-testid={`event-card-${event.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-orange-600" />
                          {formatEventType(event.type)}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                          </span>
                          {event.ipAddress && (
                            <span className="flex items-center gap-1">
                              <Monitor className="w-3 h-3" />
                              {event.ipAddress}
                            </span>
                          )}
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(event.riskScore)}
                        {event.resolved ? (
                          <Badge variant="default" className="bg-green-600" data-testid={`badge-resolved-${event.id}`}>
                            Resolved
                          </Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resolveEventMutation.mutate(event.id)}
                            disabled={resolveEventMutation.isPending}
                            data-testid={`button-resolve-${event.id}`}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {resolveEventMutation.isPending ? "Resolving..." : "Resolve"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Risk Score:</span> {event.riskScore}/100
                      </div>
                      {event.details && Object.keys(event.details).length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium">Details:</span>
                          <pre className="mt-1 p-2 bg-muted rounded-md text-xs overflow-x-auto">
                            {JSON.stringify(event.details, null, 2)}
                          </pre>
                        </div>
                      )}
                      {event.resolved && event.resolvedAt && (
                        <div className="text-sm text-muted-foreground">
                          Resolved {formatDistanceToNow(new Date(event.resolvedAt), { addSuffix: true })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
