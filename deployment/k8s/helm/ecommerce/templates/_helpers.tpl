{{/*
Common labels applied to every resource
*/}}
{{- define "ecommerce.labels" -}}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}

{{/*
Selector labels for a given component
Usage: include "ecommerce.selectorLabels" (dict "component" "auth" "Release" .Release)
*/}}
{{- define "ecommerce.selectorLabels" -}}
app.kubernetes.io/name: {{ .component }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Full image name for an app service
Usage: include "ecommerce.image" (dict "name" "auth" "Values" .Values)
*/}}
{{- define "ecommerce.image" -}}
{{ .Values.global.registry }}/ecommerce-{{ .name }}:{{ .Values.global.tag }}
{{- end }}

{{/*
PostgreSQL DATABASE_URL for a service
Usage: include "ecommerce.dbUrl" (dict "svc" .Values.auth)
*/}}
{{- define "ecommerce.dbUrl" -}}
postgresql://{{ .svc.db.user }}:{{ .svc.db.password }}@{{ .svc.db.name }}:5432/{{ .svc.db.database }}
{{- end }}
