# Mancala Awelé

Jogo de Mancala Awelé para o navegador, feito para jogar no celular.

- **Criar partida**: gera um número de 4 dígitos e um QR Code.
- **Entrar em partida**: o colega digita o número ou lê o QR Code com a câmera.
- **Entender as regras**: aula animada em 8 passos, com o texto completo das regras logo abaixo.
- Extra: treinar contra o computador.

A partida online liga os dois aparelhos direto um ao outro (WebRTC, com o servidor gratuito do [PeerJS](https://peerjs.com/) para o primeiro contato). Ninguém precisa criar conta.

Tudo fica num arquivo só: `index.html`.

Quem sai de uma partida online pode voltar: a partida fica guardada no aparelho por 12 horas e aparece um cartão "Voltar para a partida" na tela inicial.

## Testes

| Teste | Como rodar | O que confere |
|---|---|---|
| Regras (automático) | `node testes/testar-regras.js` | Sintaxe do jogo, situações do livro, 100 partidas inteiras e a velocidade do computador. O GitHub roda sozinho a cada atualização. |
| 100 partidas online | abrir `testes/bateria-online.html` | Duplas de jogadores simulados jogando pela internet; cada partida é conferida lance a lance. |
| Reconexão | abrir `testes/bateria-reconexao.html` | Um "celular" e um "computador" jogando; no meio, o jogo é fechado e reaberto, os jogadores saem e voltam, e até caem no meio de um lance. |
| Testes extras | abrir `testes/testes-extras.html` | Telas de 7 tamanhos, entradas erradas, dados estragados, colega mandando mensagens absurdas, toque duplo, desfazer, aula das regras, sem internet, muitas partidas seguidas e acessibilidade. |

As páginas de teste precisam ser abertas por um servidor (por exemplo `python -m http.server` na pasta do projeto) e aceitam opções no endereço, como `?partidas=30&pares=2`. Elas usam o jogo em modo de teste (`?rapido`), sem animações.

## Regras

Conforme o livro *Mancala Awelé*, da Coleção Jogos de Tabuleiro (Secretaria Municipal de Educação de São Paulo, 2020).
