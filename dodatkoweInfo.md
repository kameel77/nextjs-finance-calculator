# Wskazówki projektowe

## 2025-10-18 (iteracja wcześniejsza)
- Podłączyć realny endpoint Apps Script (`NEXT_PUBLIC_APPS_SCRIPT_URL`) i zaprojektować obsługę zapisu.
- Rozwinąć formularz i logikę kalkulacji zgodnie z `planning.md`, wykorzystując przygotowane schematy danych.

## 2025-10-18 (aktualna iteracja)
- Jeśli arkusz Google Sheets zmieni identyfikator, ustaw zmienną `GOOGLE_SHEET_ID`; przy korzystaniu z własnego Apps Script ustaw `NEXT_PUBLIC_APPS_SCRIPT_URL`.
- Dostosuj `NEXT_PUBLIC_VAT_RATE`, aby wartości netto odpowiadały aktualnej stawce VAT.
- Przy pracy w środowisku bez dostępu do Google Sheets rozważ wprowadzenie cache/fallbacku dla `/api/catalog`, aby build nie kończył się ostrzeżeniami `fetch failed`.
- Domyślnie build korzysta z fallbacku katalogu (`CATALOG_FETCH_STRATEGY=mock`); aby wymusić pobieranie zdalne podczas buildów ustaw `ENABLE_REMOTE_CATALOG=true` lub usuń flagi `CATALOG_FETCH_STRATEGY`/`DISABLE_REMOTE_FETCH`.
