# Kubernetes - SYNAP Community Web

Manifests iniciais para executar `apps/community-web` em Kubernetes.

## Recursos

- `ConfigMap` com URLs publicas.
- `Deployment` com 2 replicas.
- `Service` interno `ClusterIP`.
- `Ingress` para `community.synap.app`.
- `HorizontalPodAutoscaler` por CPU.
- Probes em `/api/health`.

## Uso

```bash
kubectl apply -f apps/community-web/deploy/k8s/community-web.yaml
```

Antes de aplicar em producao, ajuste:

- imagem do container;
- host do ingress;
- classe de ingress;
- URLs da API e da comunidade;
- limites de CPU/memoria conforme observabilidade real.
