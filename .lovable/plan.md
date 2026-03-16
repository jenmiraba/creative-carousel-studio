
Objetivo: destrabar el proxy de Notion asegurando que se despliegue la versión nueva de la función y no siga corriendo una versión vieja.

Qué confirmé al revisar el proyecto
- El frontend ya usa el proxy correctamente:
  - `src/components/carousel/StepNotion.tsx` llama `supabase.functions.invoke("notion-proxy", ...)`.
- El código actual de `supabase/functions/notion-proxy/index.ts` ya no incluye `sorts`.
- El repositorio tampoco tiene ninguna otra referencia a `userDefined:ID` ni `sorts`.
- Hay un error de compilación real en la Edge Function:
  - en el `catch`, `error` es de tipo `unknown`
  - esto rompe el type-check y puede impedir que la versión nueva se despliegue
- Ese escenario encaja exactamente con lo que describís: el runtime sigue sirviendo una versión vieja porque la versión actual no logra publicarse.

Plan de implementación
1. Corregir el error de TypeScript en `supabase/functions/notion-proxy/index.ts`
   - Cambiar el manejo del `catch` para tipar/normalizar el error de forma segura.
   - Ejemplo de enfoque:
     - `const message = error instanceof Error ? error.message : "Unknown error"`
   - Esto elimina el build error y permite que la función vuelva a compilar.

2. Mantener el payload del proxy simple y explícito
   - Dejar que la función envíe únicamente:
     - `page_size`
     - y opcionalmente `body` si querés pasar filtros/cursor en el futuro
   - No reintroducir ningún `sorts`.

3. Mejorar la compatibilidad entre frontend y función
   - La función hoy espera `{ notionToken, databaseId, pageSize }`.
   - Tu requerimiento original menciona `{ notionToken, databaseId, body }`.
   - Voy a dejarla compatible con ambos formatos:
     - si llega `body`, reenvía ese body a Notion
     - si no llega, usa `{ page_size: pageSize ?? 100 }`
   - Así evitamos otra desincronización entre cliente y backend.

4. Forzar un redeploy limpio de `notion-proxy`
   - Una vez corregido el build error, desplegar de nuevo la función.
   - Si hiciera falta, como siguiente paso operativo:
     - eliminar y recrear la función
   - Pero primero conviene arreglar la compilación, porque ese es el bloqueo más probable.

5. Verificar que la función desplegada sea realmente la nueva
   - Probar la función desplegada con una invocación real.
   - Confirmar que:
     - responde sin el error `userDefined:ID`
     - devuelve la respuesta actual de Notion
   - Si apareciera cualquier 500/401, revisar logs de la función inmediatamente.

Cambios concretos previstos
- `supabase/functions/notion-proxy/index.ts`
  - arreglar el `catch`
  - aceptar `body` opcional
  - construir el request body de Notion sin `sorts`
- `src/components/carousel/StepNotion.tsx`
  - opcionalmente alinear el body enviado para usar `body: { page_size: 100 }`
  - si no hace falta, puede quedarse como está porque ya usa el proxy

Resultado esperado
- La Edge Function compila y se publica correctamente.
- El runtime deja de usar la versión vieja.
- Desaparece el error:
  - `Could not find sort property with name or id: userDefined:ID`
- La carga de posts vuelve a depender solo de token, permisos y esquema real de la base.

Detalles técnicos
```text
Frontend
  StepNotion.tsx
    -> supabase.functions.invoke("notion-proxy", body)

Edge Function
  notion-proxy/index.ts
    -> valida input
    -> POST server-side a Notion /v1/databases/{databaseId}/query
    -> reenvía JSON de Notion tal cual

Problema actual
  nuevo código local != código corriendo
  causa probable:
    build roto por TS18046 en catch(error: unknown)
  efecto:
    deploy no actualiza runtime
    runtime sigue con versión vieja que aún tenía `sorts`
```

Alcance y riesgo
- Cambio pequeño y focalizado.
- Sin cambios de base de datos.
- Riesgo bajo: el ajuste principal es de compilación y compatibilidad del payload.
