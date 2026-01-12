{{/*
Expand the name of the chart.
*/}}
{{- define "database.name" -}}
{{- printf "database" }}
{{- end }}

{{/*
Compatibility helpers.

values.yaml references "component.*" helpers for the database component.
Define them here so tpl() evaluation works without requiring values changes.
*/}}
{{- define "component.name" -}}
{{- include "database.name" . -}}
{{- end }}

{{- define "component.fullname" -}}
{{- include "database.fullname" . -}}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "database.fullname" -}}
{{- $componentName := include "database.name" .  }}
{{- if .Values.database.fullnameOverride }}
{{- .Values.database.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $componentName | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "database.labels" -}}
{{ include "database.selectorLabels" . }}
{{- if .Values.global.tag }}
app.kubernetes.io/image-version: {{ .Values.global.tag | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/short-name: {{ include "database.name" . }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "database.selectorLabels" -}}
app.kubernetes.io/name: {{ include "database.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

