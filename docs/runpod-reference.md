# RunPod Platform Reference

**Last Modified**: 2025-12-27 21:00 EST
**Source**: RunPod Documentation (docs.runpod.io)
**Status**: Canonical Reference

## Purpose

Complete RunPod platform documentation for the MetaDJ Scope hackathon project. Covers Pod deployment, GPU selection, storage, networking, pricing, and programmatic management.

---

## Quick Start

### Deploy Daydream Scope on RunPod

1. **Access Template**: https://runpod.io/console/deploy?template=daydream-scope
2. **Create HuggingFace Token**: https://huggingface.co → Settings → Access Tokens → New token (read permissions)
3. **Select GPU**: RTX 4090 (24GB) minimum, RTX 5090 (32GB) recommended for krea-realtime-video
4. **Configure Environment**: Edit Template → Add `HF_TOKEN` environment variable
5. **Deploy**: Click "Deploy On-Demand"
6. **Access**: Open `https://{pod-id}-8000.proxy.runpod.net` when ready

---

## Pod Fundamentals

### What is a Pod?

A Pod is RunPod's core compute unit—a containerized environment with GPU access. Key components:

| Component | Description |
|-----------|-------------|
| **Container Image** | Docker image with software packages and dependencies |
| **GPU** | Dedicated graphics processing unit (various NVIDIA models) |
| **Container Disk** | Volatile storage for the running container |
| **Volume Disk** | Persistent storage that survives Pod restarts |
| **Network Volume** | Permanent storage portable across Pods |

### Pod Types

| Type | Description | Best For |
|------|-------------|----------|
| **Secure Cloud** | Enterprise T3/T4 data centers, stable IPs | Production, reliability |
| **Community Cloud** | Peer-to-peer network, lower cost | Development, experimentation |

### Deployment Options

| Option | Description | Pricing |
|--------|-------------|---------|
| **On-Demand** | Immediate availability, pay per hour | Highest, guaranteed |
| **Spot** | Interruptible, automatic bidding | 50-80% savings |
| **Savings Plan** | 3-6 month commitments | Up to 30% off on-demand |

---

## GPU Selection

### Choosing the Right GPU

**Key Factors:**
1. **VRAM Requirements**: Match to model memory needs
2. **Compute Power**: CUDA cores for inference speed
3. **Cost**: Balance performance with budget
4. **Availability**: Check real-time availability

### GPU Comparison (Scope-Relevant)

| GPU | VRAM | Best For | ~On-Demand/hr |
|-----|------|----------|---------------|
| **RTX 4090** | 24 GB | General ML, longlive pipeline | $0.44 |
| **RTX 5090** | 32 GB | krea-realtime-video (Wan2.1-T2V) | $0.89-0.95 |
| **A100 PCIe** | 80 GB | Large models, high throughput | $1.89 |
| **H100 PCIe** | 80 GB | Cutting-edge, fastest inference | $3.89 |
| **RTX 4080** | 16 GB | Budget option, smaller models | $0.34 |
| **RTX 3090** | 24 GB | Cost-effective, older generation | $0.22 |

### VRAM Guidelines

| Model Size | Minimum VRAM | Recommended VRAM |
|------------|--------------|------------------|
| SD-Turbo, longlive | 16 GB | 24 GB |
| Wan2.1-T2V-1.3B | 24 GB | 32 GB |
| Large LLMs (70B) | 40 GB | 80 GB |

### Complete GPU Reference

| GPU | Memory | Secure Cloud | Community Cloud |
|-----|--------|--------------|-----------------|
| RTX 4090 | 24 GB | ✅ | ✅ |
| RTX 5090 | 32 GB | ✅ | ✅ |
| RTX 4080 | 16 GB | ✅ | ✅ |
| RTX 3090 | 24 GB | ✅ | ✅ |
| RTX A6000 | 48 GB | ✅ | ✅ |
| A100 PCIe | 80 GB | ✅ | ✅ |
| A100 SXM | 80 GB | ✅ | - |
| H100 PCIe | 80 GB | ✅ | ✅ |
| H100 SXM | 80 GB | ✅ | - |
| L40S | 48 GB | ✅ | ✅ |
| RTX A5000 | 24 GB | ✅ | ✅ |
| RTX A4000 | 16 GB | ✅ | ✅ |

---

## Storage Options

### Storage Types Comparison

| Type | Persistence | Portability | Speed | Best For |
|------|-------------|-------------|-------|----------|
| **Container Disk** | Pod lifecycle only | No | Fastest | Temporary files, cache |
| **Volume Disk** | Survives restarts | No | Fast | Working data, models |
| **Network Volume** | Permanent | Yes (same region) | Moderate | Shared data, backups |

### Container Disk

- **Volatile**: Data lost when Pod terminates
- **Default Size**: Varies by template (typically 10-20 GB)
- **Use Cases**: Temporary processing, build caches

### Volume Disk

- **Persistent**: Survives Pod stops/restarts
- **Mount Path**: Typically `/workspace`
- **Size**: Configurable at creation (up to 1TB+)
- **Use Cases**: Model weights, datasets, working files

### Network Volume

- **Permanent**: Exists independently of Pods
- **Portable**: Attach to different Pods in same region
- **Shared**: Multiple Pods can access (with limitations)
- **Billing**: Charged per GB/month regardless of Pod state
- **Use Cases**: Shared datasets, model libraries, persistent storage

### Storage Configuration

```bash
# Volume disk is mounted at /workspace by default
ls /workspace

# Network volume is mounted at specified path
ls /runpod-volume
```

---

## Networking

### Connection Options

| Method | Best For | Access |
|--------|----------|--------|
| **Web Terminal** | Quick commands, debugging | Browser-based |
| **JupyterLab** | Interactive development | Browser-based |
| **SSH** | Full remote access | Terminal client |
| **VSCode/Cursor** | IDE integration | Remote-SSH extension |

### HTTP Proxy Access

RunPod provides HTTPS proxy URLs for web services:

```
https://[POD_ID]-[INTERNAL_PORT].proxy.runpod.net
```

**Example:**
- Pod ID: `abc123xyz`
- Internal port: `8000`
- Access URL: `https://abc123xyz-8000.proxy.runpod.net`

**Proxy Limitations:**
- 100-second timeout (Cloudflare limit)
- HTTPS only (automatic SSL)
- Public accessibility (implement auth in your app)

### TCP Port Exposure

For non-HTTP services or long connections:

1. Configure TCP ports in Pod settings
2. Get assigned public IP and port from Connect menu
3. Access via `PUBLIC_IP:EXTERNAL_PORT`

**Symmetrical Port Mapping:**
- Request ports above 70000 for matching internal/external ports
- Access assigned ports via environment variables:
  ```bash
  echo $RUNPOD_TCP_PORT_70000
  ```

### Global Networking (Pod-to-Pod)

Connect Pods across data centers on a private network:

- **Internal DNS**: `POD_ID.runpod.internal`
- **Speed**: 100 Mbps between Pods
- **Security**: Isolated from public internet

**Enable:**
1. Toggle "Global Networking" during deployment
2. Filter for networking-enabled GPU configurations

**Supported Regions (17 data centers):**
- North America: CA-MTL-3, US-CA-2, US-GA-1/2, US-IL-1, US-KS-2, US-NC-1, US-TX-3/4, US-WA-1
- Europe: EU-CZ-1, EU-FR-1, EU-NL-1, EU-RO-1, EU-SE-1, EUR-IS-2
- Other: OC-AU-1

---

## Templates

### Template Types

| Type | Description | Support |
|------|-------------|---------|
| **Official** | RunPod-curated, maintained | Full support |
| **Community** | User-created, community usage | Community only |
| **Custom** | Your own configurations | Self-managed |

### Template Components

- **Container Image**: Docker image with all software
- **Hardware Specs**: Disk sizes, volume paths
- **Network Settings**: Exposed HTTP/TCP ports
- **Environment Variables**: Pre-configured settings
- **Startup Commands**: Initialization scripts

### Daydream Scope Template

The `daydream-scope` template is pre-configured for the Scope platform:

- **Image**: `daydreamlive/scope`
- **Default Port**: 8000 (HTTP)
- **Required Env**: `HF_TOKEN` for TURN server
- **VRAM Requirement**: 24GB+ (32GB for all pipelines)

---

## Pricing

### Pricing Models

| Model | Description | Discount |
|-------|-------------|----------|
| **On-Demand** | Pay per hour, guaranteed availability | Base rate |
| **Spot** | Interruptible, automatic bidding | 50-80% off |
| **3-Month Savings** | Committed usage | ~20% off |
| **6-Month Savings** | Longer commitment | ~30% off |

### Example Pricing (On-Demand)

| GPU | Secure Cloud | Community Cloud | Spot (Community) |
|-----|--------------|-----------------|------------------|
| RTX 4090 | $0.44/hr | $0.39/hr | ~$0.20/hr |
| RTX 5090 | $0.95/hr | $0.89/hr | ~$0.45/hr |
| A100 80GB | $1.89/hr | $1.59/hr | ~$0.89/hr |
| H100 80GB | $3.89/hr | $3.49/hr | ~$1.99/hr |

*Prices vary by availability and demand*

### Storage Billing

| Type | Billing |
|------|---------|
| Container Disk | Included in compute |
| Volume Disk | Billed while Pod exists |
| Network Volume | $0.07/GB/month (always charged) |

### Cost Optimization Tips

1. **Stop Pods when not in use** - Compute billing stops, volume disk retained
2. **Use Spot for development** - Significant savings, handle interrupts
3. **Right-size GPU** - Don't overprovision VRAM
4. **Clean up Network Volumes** - Charged even when unused
5. **Consider Savings Plans** - For predictable workloads

---

## Pod Management

### Deploy a Pod

**Console:**
1. Navigate to Pods → Deploy
2. Select GPU configuration
3. Configure template and storage
4. Click Deploy

**CLI:**
```bash
runpodctl pod create --name my-pod --gpu-type "RTX 4090" --template-id TEMPLATE_ID
```

### Pod States

| State | Description | Billing |
|-------|-------------|---------|
| **Running** | Active, accessible | Compute + Storage |
| **Stopped** | Paused, data preserved | Storage only |
| **Terminated** | Deleted, data lost | None |

### Common Operations

```bash
# List Pods
runpodctl pod list

# Stop a Pod (preserves data)
runpodctl pod stop POD_ID

# Start a stopped Pod
runpodctl pod start POD_ID

# Terminate a Pod (deletes data)
runpodctl pod terminate POD_ID

# Get Pod details
runpodctl pod get POD_ID
```

### SSH Access

```bash
# Configure SSH in Pod settings (expose port 22)
# Get connection details from Connect menu

ssh root@PUBLIC_IP -p EXTERNAL_PORT -i ~/.ssh/your_key
```

---

## CLI (runpodctl)

### Installation

**macOS (Homebrew):**
```bash
brew install runpod/runpodctl/runpodctl
```

**macOS (ARM/Apple Silicon):**
```bash
wget https://github.com/runpod/runpodctl/releases/download/v1.14.3/runpodctl-darwin-arm64 -O runpodctl
chmod +x runpodctl
sudo mv runpodctl /usr/local/bin/runpodctl
```

**Linux:**
```bash
wget https://github.com/runpod/runpodctl/releases/download/v1.14.3/runpodctl-linux-amd64 -O runpodctl
chmod +x runpodctl
sudo cp runpodctl /usr/bin/runpodctl
```

### Configuration

```bash
# Add API key
runpodctl config --apiKey YOUR_API_KEY

# Verify installation
runpodctl version

# Get help
runpodctl help
```

### File Transfer

```bash
# Send files to Pod (generates connection code)
runpodctl send ./my-data

# Send with custom code
runpodctl send ./my-data --code rainbow-unicorn-42

# Receive files on Pod (use same code)
runpodctl receive --code rainbow-unicorn-42
```

---

## Python SDK

### Installation

```bash
python -m venv env
source env/bin/activate  # or env\Scripts\activate on Windows
pip install runpod
```

### Configuration

```python
import runpod
import os

runpod.api_key = os.getenv("RUNPOD_API_KEY")
```

### Common Operations

```python
import runpod
import json

# List available GPUs
gpus = runpod.get_gpus()
print(json.dumps(gpus, indent=2))

# Get specific GPU details
gpu = runpod.get_gpu("NVIDIA A100 80GB PCIe")
print(json.dumps(gpu, indent=2))

# List endpoints
endpoints = runpod.get_endpoints()
print(endpoints)

# Create template
template = runpod.create_template(
    name="my-template",
    image_name="runpod/base:0.1.0"
)

# Create endpoint
endpoint = runpod.create_endpoint(
    name="my-endpoint",
    template_id=template["id"],
    gpu_ids="AMPERE_16",
    workers_min=0,
    workers_max=1
)
```

### GPU Response Example

```json
{
  "maxGpuCount": 8,
  "id": "NVIDIA A100 80GB PCIe",
  "displayName": "A100 80GB",
  "manufacturer": "Nvidia",
  "memoryInGb": 80,
  "secureCloud": true,
  "communityCloud": true,
  "securePrice": 1.89,
  "communityPrice": 1.59,
  "communitySpotPrice": 0.89,
  "lowestPrice": {
    "minimumBidPrice": 0.89,
    "uninterruptablePrice": 1.59
  }
}
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Can't connect to Pod | Verify Pod is running, check exposed ports, confirm URL format |
| 524 Timeout Error | Request takes >100s; use TCP or optimize response time |
| Connection Refused | Bind service to `0.0.0.0`, not `localhost` |
| Port Already in Use | Check for conflicting services in Pod |
| SSH Connection Failed | Verify port 22 exposed, check public IP/port mapping |
| Storage Full | Increase volume size or clean up files |
| Pod Won't Start | Check GPU availability, template configuration |

### Best Practices

1. **Always stop Pods when not in use** - Saves money
2. **Use volume disk for important data** - Survives restarts
3. **Implement authentication** - Public URLs are accessible
4. **Handle 100s timeout** - Design for proxy limits
5. **Monitor usage** - Track costs in console

---

## MetaDJ Scope Context

### Current Instance

| Property | Value |
|----------|-------|
| **Pod Name** | metadj-scope |
| **Pod ID** | `t68d6nv3pi7uia` |
| **GPU** | RTX Pro 6000 (96GB VRAM) |
| **Cost** | $1.84/hr (On-Demand) |
| **Scope UI** | https://t68d6nv3pi7uia-8000.proxy.runpod.net |
| **Console** | https://console.runpod.io/pods?id=t68d6nv3pi7uia |

### Why RTX Pro 6000?

- **96GB VRAM** provides massive headroom for all Scope pipelines
- **Blackwell architecture** delivers cutting-edge compute performance
- **longlive pipeline** requires ~20GB VRAM (runs comfortably)
- **krea-realtime-video** requires 32GB VRAM (runs with 64GB headroom)
- Enables running multiple pipelines simultaneously without VRAM constraints
- Upgraded from RTX 5090 (32GB) on Dec 27 after hitting VRAM limits

### Cost Management

- **Stop when not working**: $1.84/hr adds up quickly
- **Restart takes 2-3 minutes**: Plan accordingly
- **Models cached**: No re-download on restart (if using volume)

---

## Related Documentation

### Internal
- `scope-platform-reference.md` - Daydream Scope platform overview
- `api-reference.md` - Scope API endpoints and parameters
- `workflows-reference.md` - WebRTC, VACE, LoRA workflows
- `research.md` - Project research and validation notes

### External
- **RunPod Docs**: https://docs.runpod.io
- **RunPod Console**: https://console.runpod.io
- **RunPod GitHub**: https://github.com/runpod
- **runpodctl Releases**: https://github.com/runpod/runpodctl/releases
- **Python SDK**: https://pypi.org/project/runpod/
