---
layout: default
title: Parques Infantis
permalink: /parques-infantis/
---

# Parques Infantis em Lisboa

Este projeto apresenta um mapa que estima a **distância até parques infantis** por zona da cidade, útil para avaliar carências por freguesia e priorizar investimento.

- Metodologia (resumo): camadas em grelha (H3/hexágonos ou polígonos equivalentes) com o atributo `dist_m`, que representa a distância ao **parque infantil** mais próximo.
- Fonte de base: CML (Parques Infantis), INE (Censos) para ponderações (a integrar futuramente).

## Mapa

<iframe
  src="{{ '/parques-infantis/mapa/' | relative_url }}"
  title="Mapa — Parques Infantis"
  class="iframe-map"
  loading="lazy"
  referrerpolicy="no-referrer"
></iframe>

> Nota: a visualização em ecrã inteiro encontra-se em [**/parques-infantis/mapa/**]({{ '/parques-infantis/mapa/' | relative_url }}).
