"""Setup configuration for Authflow Python SDK"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="authflow",
    version="1.0.0",
    author="Authflow",
    author_email="support@authflow.dev",
    description="Official Python SDK for Authflow Authentication Platform",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/authflow/python-sdk",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
    python_requires=">=3.8",
    install_requires=[
        "requests>=2.28.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "black>=23.0.0",
            "mypy>=1.0.0",
            "types-requests>=2.28.0",
        ],
    },
    keywords="authentication auth oauth mfa 2fa security",
    project_urls={
        "Bug Reports": "https://github.com/authflow/python-sdk/issues",
        "Documentation": "https://docs.authflow.dev",
        "Source": "https://github.com/authflow/python-sdk",
    },
)
