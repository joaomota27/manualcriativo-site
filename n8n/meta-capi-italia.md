# Meta CAPI + Hotmart — Itália

Os arquivos deste diretório implementam a correlação completa entre a visita ao
site, o checkout Hotmart e o evento `Purchase` da Meta.

## Arquivos

- `meta-capi-italia.workflow.json`: recebe `PageView` e `InitiateCheckout`, envia
  os eventos à Meta e salva `fbc`, `fbp`, IP e user-agent pelo `tracking_id`.
- `hotmart-purchase-meta-capi.workflow.json`: recebe `PURCHASE_APPROVED` da
  Hotmart, encontra os dados pelo `sck` e envia `Purchase` à Meta.

## Instalação

1. Importe `meta-capi-italia.workflow.json` no n8n.
2. Abra o node `Enviar evento do site para Meta` e substitua
   `COLE_SEU_TOKEN_CAPI_AQUI` pelo token da Meta.
3. Execute manualmente o node `Executar uma vez - criar tabela`. Ele cria a Data
   Table `meta_tracking`; a opção de reutilização evita duplicar a tabela.
4. Ative o workflow e confirme que a URL de produção continua sendo
   `https://jonyai-n8n-webhook.c9hj2a.easypanel.host/webhook/pixel`.
5. Importe `hotmart-purchase-meta-capi.workflow.json`.
6. No node `Validar Hotmart e extrair compra`, substitua
   `COLE_SEU_HOTTOK_AQUI` pelo HOTTOK configurado na Hotmart.
7. No node `Enviar Purchase para Meta`, coloque o mesmo token da Meta.
8. Ative o workflow. A URL de produção será
   `https://jonyai-n8n-webhook.c9hj2a.easypanel.host/webhook/hotmart-purchase`.
9. Na Hotmart, cadastre essa URL em **Ferramentas > Webhook**, selecione a versão
   2 e marque o evento **Compra aprovada (`PURCHASE_APPROVED`)**.

## Como a correlação funciona

O site cria um UUID sem dados pessoais e o adiciona ao checkout como `sck`. O
mesmo UUID acompanha os eventos enviados ao primeiro workflow. Quando a Hotmart
notifica a compra, o segundo workflow lê `data.purchase.origin.sck`, recupera os
identificadores do navegador e acrescenta os dados fornecidos pelo comprador.

Email, telefone internacional, nome, cidade, estado, CEP, país, `buyer.ucode` e o
identificador da sessão são normalizados e transformados em SHA-256 antes do
envio. `fbc`, `fbp`, IP e user-agent são enviados sem hash, como exige a Meta.

O `event_id` de `Purchase` é a transação Hotmart. Assim, uma repetição do webhook
usa o mesmo ID e a Meta pode deduplicá-la. `InitiateCheckout` mantém outro
`event_id`, pois é um evento diferente.

## Teste recomendado

1. Abra a página italiana com `?fbclid=teste` apenas em ambiente de teste.
2. Clique em um botão de checkout e confirme que a URL contém `sck=`.
3. Confira se surgiu uma linha em `meta_tracking` no n8n.
4. Use o envio de teste da Hotmart ou uma compra de teste.
5. Confira no Gerenciador de Eventos da Meta se `Purchase` recebeu a transação
   Hotmart como `event_id` e se os parâmetros de correspondência aparecem.

Não publique tokens reais ou o HOTTOK no GitHub. Eles devem existir somente nos
nodes do n8n ou, de preferência, em credenciais/variáveis seguras da instância.
