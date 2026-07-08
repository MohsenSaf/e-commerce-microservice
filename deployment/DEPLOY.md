# Deployment Guide — Docker Swarm & Kubernetes

## Prerequisites

```fish
# Ubuntu — install Docker
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER   # re-login after this

# kubectl
sudo apt install -y kubectl

# Helm 3
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# k3s (lightweight Kubernetes for local testing)
curl -sfL https://get.k3s.io | sh -
sudo chmod 644 /etc/rancher/k3s/k3s.yaml
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
```

---

## 1. Build & Push Docker Images

```fish
# Set your Docker Hub username
set REGISTRY mohsensaf   # change to yours
set TAG latest

# Build all images
for svc in gateway microservice-auth microservice-product microservice-cart \
           microservice-inventory microservice-order microservice-payment \
           microservice-shipping microservice-notification microservice-reviews
    docker build -t $REGISTRY/ecommerce-(string replace 'microservice-' '' $svc):$TAG ./$svc
    docker push $REGISTRY/ecommerce-(string replace 'microservice-' '' $svc):$TAG
end
```

---

## 2. Docker Swarm

### Init Swarm (first time only)
```fish
docker swarm init
```

### Create secrets
```fish
echo "your-access-secret"  | docker secret create jwt_access_secret -
echo "your-refresh-secret" | docker secret create jwt_refresh_secret -
```

### Deploy the stack
```fish
set -x REGISTRY mohsensaf
set -x TAG latest
set -x JWT_ACCESS_SECRET your-access-secret
set -x JWT_REFRESH_SECRET your-refresh-secret

docker stack deploy -c docker-stack.yml ecommerce
```

### Useful Swarm commands
```fish
docker stack services ecommerce          # list all services + replica status
docker stack ps ecommerce                # see where each task is running
docker service logs ecommerce_gateway -f # stream logs for a service
docker service scale ecommerce_microservice-auth=3   # scale up auth
docker stack rm ecommerce               # tear everything down
```

### Run Prisma migrations in Swarm
```fish
# Run once per service after first deploy
for svc in auth product cart inventory order payment shipping notification reviews
    set container (docker ps --filter "name=ecommerce_microservice-$svc" -q | head -1)
    docker exec $container npx prisma migrate deploy
end
```

---

## 3. Kubernetes (Helm)

### Add nginx ingress controller (if not installed)
```fish
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install ingress-nginx ingress-nginx/ingress-nginx --namespace ingress-nginx --create-namespace
```

### Install the chart
```fish
helm install ecommerce ./k8s/helm/ecommerce \
  --namespace ecommerce \
  --create-namespace \
  --set global.registry=mohsensaf \
  --set global.jwtAccessSecret=your-access-secret \
  --set global.jwtRefreshSecret=your-refresh-secret
```

### Verify deployment
```fish
kubectl get pods -n ecommerce           # all pods should be Running
kubectl get svc -n ecommerce            # check LoadBalancer EXTERNAL-IP
kubectl get ingress -n ecommerce        # check ingress
```

### Run Prisma migrations in Kubernetes
```fish
for svc in auth product cart inventory order payment shipping notification reviews
    set pod (kubectl get pod -n ecommerce -l app=$svc -o jsonpath='{.items[0].metadata.name}')
    kubectl exec -n ecommerce $pod -- npx prisma migrate deploy
end
```

### Upgrade / rollback
```fish
# Upgrade (e.g. after pushing new images)
helm upgrade ecommerce ./k8s/helm/ecommerce --namespace ecommerce

# Rollback to previous release
helm rollback ecommerce 1 --namespace ecommerce
```

### Scale a service
```fish
kubectl scale deployment auth --replicas=4 -n ecommerce
```

### Tear down
```fish
helm uninstall ecommerce --namespace ecommerce
kubectl delete namespace ecommerce
```

---

## 4. Architecture Overview

```
Internet
   │
   ▼
[Ingress / LoadBalancer]
   │  :80 → :3000
   ▼
[Gateway]  TCP ──┬──▶ [Auth        :4001] ──▶ [auth-db]
                 ├──▶ [Product     :4002] ──▶ [product-db]
                 ├──▶ [Cart        :4003] ──▶ [cart-db]
                 ├──▶ [Inventory   :4004] ──▶ [inventory-db]
                 ├──▶ [Order       :4005] ──▶ [order-db]
                 ├──▶ [Payment     :4006] ──▶ [payment-db]
                 ├──▶ [Shipping    :4007] ──▶ [shipping-db]
                 ├──▶ [Notification:4008] ──▶ [notification-db]
                 └──▶ [Reviews     :4009] ──▶ [reviews-db]
```

## 5. Port & Image Reference

| Service | TCP Port | Docker Image |
|---|---|---|
| gateway | 3000 | mohsensaf/ecommerce-gateway |
| auth | 4001 | mohsensaf/ecommerce-auth |
| product | 4002 | mohsensaf/ecommerce-product |
| cart | 4003 | mohsensaf/ecommerce-cart |
| inventory | 4004 | mohsensaf/ecommerce-inventory |
| order | 4005 | mohsensaf/ecommerce-order |
| payment | 4006 | mohsensaf/ecommerce-payment |
| shipping | 4007 | mohsensaf/ecommerce-shipping |
| notification | 4008 | mohsensaf/ecommerce-notification |
| reviews | 4009 | mohsensaf/ecommerce-reviews |
