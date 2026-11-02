# Meta Conversions API — Itália

O site envia ao webhook `POST /webhook/pixel` um campo form-urlencoded chamado
`payload`. O valor de `payload` é uma string JSON. Esse formato evita o preflight
CORS e não expõe o token da Meta no navegador.

## Flusso n8n

1. **Webhook**
   - Method: `POST`
   - Path: `pixel`
   - Response: usando o nó `Respond to Webhook`
2. **Code** — incolla il codice abaixo.
3. **HTTP Request** — envia o JSON produzido para a Meta.
4. **Respond to Webhook** — status `200`, corpo `{"ok":true}`.

## Code node

```javascript
const input = $input.first().json;
const rawPayload = input.body?.payload ?? input.payload;

if (!rawPayload) {
  throw new Error('Missing payload');
}

const event = typeof rawPayload === 'string'
  ? JSON.parse(rawPayload)
  : rawPayload;

const headers = input.headers ?? {};
const forwardedFor = headers['x-forwarded-for'] ?? headers['x-real-ip'] ?? '';
const clientIp = String(forwardedFor).split(',')[0].trim();

const userData = {
  ...event.user_data,
  client_user_agent: event.user_agent || headers['user-agent'] || undefined,
  client_ip_address: clientIp || undefined,
};

Object.keys(userData).forEach((key) => {
  if (userData[key] === undefined || userData[key] === null || userData[key] === '') {
    delete userData[key];
  }
});

return [{
  json: {
    data: [{
      event_name: event.event_name,
      event_time: event.event_time,
      event_id: event.event_id,
      action_source: 'website',
      event_source_url: event.event_source_url,
      user_data: userData,
      custom_data: event.custom_data ?? {},
    }],
  },
}];
```

## HTTP Request node

- Method: `POST`
- URL: `https://graph.facebook.com/vXX.X/2328916111389472/events`
  - substitua `vXX.X` pela versão indicada no Gerenciador de Eventos da Meta.
- Query parameter: `access_token`
  - mantenha o token apenas em uma credencial ou variável segura do n8n.
- Body Content Type: `JSON`
- Body: `={{ $json }}`
- Durante o teste, inclua `test_event_code` no corpo. Remova-o ao entrar em produção.

## Campos

- `fbc`: cookie `_fbc` ou valor derivado de `fbclid` pelo site.
- `fbp`: cookie `_fbp` criado pelo Meta Pixel após consentimento.
- `client_ip_address`: obtido no n8n pelo primeiro IP de `x-forwarded-for`.
- `client_user_agent`: enviado pelo navegador e conferido com o cabeçalho recebido.
- `ct`, `st`, `country`: envie apenas quando vierem de uma fonte confiável, como dados
  fornecidos no checkout. Normalize em minúsculas e aplique SHA-256 antes de enviar.
  Não invente esses campos a partir do idioma do navegador. A Meta já usa o IP para
  localização aproximada.

O mesmo `event_id` é usado no Pixel do navegador e na CAPI para deduplicação.

