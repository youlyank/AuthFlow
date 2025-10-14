import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Shield, Plus, Trash2, Globe, MapPin } from "lucide-react";

interface IpRestriction {
  id: string;
  tenantId: string;
  type: "allow" | "block";
  ipAddress: string | null;
  countryCode: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function IpRestrictionsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [restrictionType, setRestrictionType] = useState<"allow" | "block">("block");
  const [targetType, setTargetType] = useState<"ip" | "country">("ip");
  const [ipAddress, setIpAddress] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const { data: restrictions, isLoading } = useQuery<IpRestriction[]>({
    queryKey: ["/api/ip-restrictions"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/ip-restrictions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ip-restrictions"] });
      toast({
        title: "IP restriction created",
        description: "The IP restriction has been created successfully",
      });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to create restriction",
        description: error.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/ip-restrictions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ip-restrictions"] });
      toast({
        title: "Restriction deleted",
        description: "The IP restriction has been removed",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete restriction",
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setRestrictionType("block");
    setTargetType("ip");
    setIpAddress("");
    setCountryCode("");
    setDescription("");
  };

  const handleCreate = () => {
    const data: any = {
      type: restrictionType,
      description: description || null,
    };

    if (targetType === "ip") {
      data.ipAddress = ipAddress;
      data.countryCode = null;
    } else {
      data.countryCode = countryCode.toUpperCase();
      data.ipAddress = null;
    }

    createMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const allowList = restrictions?.filter((r) => r.type === "allow") || [];
  const blockList = restrictions?.filter((r) => r.type === "block") || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">IP Restrictions</h1>
          <p className="text-muted-foreground mt-1">
            Control access based on IP addresses and geographic locations
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-restriction">
              <Plus className="mr-2 h-4 w-4" />
              Add Restriction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create IP Restriction</DialogTitle>
              <DialogDescription>
                Block or allow access from specific IPs or countries
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Restriction Type</Label>
                <Select value={restrictionType} onValueChange={(v: any) => setRestrictionType(v)}>
                  <SelectTrigger data-testid="select-restriction-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="block">Block (Deny Access)</SelectItem>
                    <SelectItem value="allow">Allow (Whitelist)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Target Type</Label>
                <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
                  <SelectTrigger data-testid="select-target-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ip">IP Address / CIDR</SelectItem>
                    <SelectItem value="country">Country Code</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {targetType === "ip" ? (
                <div className="space-y-2">
                  <Label>IP Address or CIDR</Label>
                  <Input
                    placeholder="192.168.1.0/24 or 203.0.113.42"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    data-testid="input-ip-address"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use CIDR notation for ranges (e.g., 192.168.1.0/24)
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Country Code (ISO 3166-1 alpha-2)</Label>
                  <Input
                    placeholder="US, CN, RU, etc."
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    maxLength={2}
                    data-testid="input-country-code"
                  />
                  <p className="text-xs text-muted-foreground">
                    2-letter ISO country code (e.g., US, GB, DE)
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Textarea
                  placeholder="Reason for this restriction..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  data-testid="input-description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreate}
                disabled={
                  (targetType === "ip" && !ipAddress) ||
                  (targetType === "country" && !countryCode) ||
                  createMutation.isPending
                }
                data-testid="button-create-restriction-confirm"
              >
                {createMutation.isPending ? "Creating..." : "Create Restriction"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              <CardTitle>Block List</CardTitle>
            </div>
            <CardDescription>IPs and countries that are denied access</CardDescription>
          </CardHeader>
          <CardContent>
            {blockList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No blocked IPs or countries
              </p>
            ) : (
              <div className="space-y-3">
                {blockList.map((restriction) => (
                  <div
                    key={restriction.id}
                    className="flex items-start justify-between p-3 rounded-md border hover-elevate"
                    data-testid={`restriction-${restriction.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {restriction.ipAddress ? (
                          <>
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <code className="text-sm font-mono">{restriction.ipAddress}</code>
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <Badge variant="outline">{restriction.countryCode}</Badge>
                          </>
                        )}
                      </div>
                      {restriction.description && (
                        <p className="text-xs text-muted-foreground">{restriction.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(restriction.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${restriction.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <CardTitle>Allow List</CardTitle>
            </div>
            <CardDescription>IPs and countries that are explicitly allowed</CardDescription>
          </CardHeader>
          <CardContent>
            {allowList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No allowed IPs or countries
              </p>
            ) : (
              <div className="space-y-3">
                {allowList.map((restriction) => (
                  <div
                    key={restriction.id}
                    className="flex items-start justify-between p-3 rounded-md border hover-elevate"
                    data-testid={`restriction-${restriction.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {restriction.ipAddress ? (
                          <>
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <code className="text-sm font-mono">{restriction.ipAddress}</code>
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <Badge variant="outline">{restriction.countryCode}</Badge>
                          </>
                        )}
                      </div>
                      {restriction.description && (
                        <p className="text-xs text-muted-foreground">{restriction.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(restriction.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${restriction.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
