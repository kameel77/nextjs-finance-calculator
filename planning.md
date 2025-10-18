# Product Requirements Document – Izzy Finance Calculator (Next.js)

## 1. Cel Produktu
- Dostarczyć webowy kalkulator finansowania samochodów jako aplikację Next.js z interfejsem Material Design.
- Odwzorować obecną logikę kalkulacji (https://izzycore.com/mock) i umożliwić szybkie generowanie ofert dla doradców.
- Zapewnić bezpieczne, niezawodne pobieranie danych o produktach i usługach z Google Apps Script (REST API).

## 2. Persony
- **Doradca salonu** – zestawia oferty finansowania podczas rozmów z klientami, potrzebuje szybkich wyników netto/brutto.
- **Kierownik sprzedaży** – nadzoruje spójność ofert, aktualizuje dane źródłowe w arkuszu Google.
- **Klient biznesowy (rozszerzenie)** – przegląda wyliczenia online w trybie samoobsługowym.

## 3. Zakres MVP
- Formularz parametrów (rodzaj klienta, typ finansowania, marka/model, warunki umowy, ceny, usługi).
- Walidacje zależne od produktu (min. wpłata, max. balon, max. długość kontraktu).
- Obliczenia finansowe: oprocentowanie, rata annuitetowa, koszty usług; prezentacja netto/brutto.
- Pobieranie danych z Apps Script; obsługa loadera i komunikatów błędów.
- Sekcja wyników w kartach Material, widok szczegółów oraz stan początkowy „brak wyników”.

## 4. Poza Zakresem (MVP)
- Autoryzacja użytkowników.
- Edycja danych w aplikacji (źródło prawdy: arkusz Google).
- Zapisywanie ofert, generowanie PDF, integracje CRM.
- Wielojęzyczność.

## 5. User Stories (przykłady)
1. Jako doradca wybieram typ klienta i produkt finansowania, aby zobaczyć wymagane pola i tryb netto/brutto.
2. Jako doradca wybieram markę i model, aby aplikacja załadowała dostępne usługi dodatkowe z odpowiednimi cenami.
3. Jako doradca ustawiam wpłatę własną, a aplikacja informuje mnie o minimalnym dopuszczalnym poziomie.
4. Jako doradca klikam „Oblicz”, aby uzyskać ratę miesięczną, ratę końcową i całkowity koszt.
5. Jako doradca widzę powiadomienie, gdy dane z Apps Script nie są dostępne lub zawierają błąd.

## 6. Wymagania Funkcjonalne
- Next.js (App Router) z komponentami klienckimi dla formularza i wyników; stan globalny (React Context/Zustand).
- Pobranie danych: `GET {APPS_SCRIPT_URL}?action=getAll`; loader, retry 1x, obsługa błędów.
- Mapowanie danych na struktury produktów (kredyt/leasing), parametrów finansowania i usług dodatkowych.
- Kalkulacje odwzorowujące istniejący algorytm (oprocentowanie, PV, FV, rata annuitetowa, VAT 23%).
- Dynamiczne renderowanie usług (checkboxy) na podstawie marki/modelu/kontraktu/przebiegu.
- Sekcja wyników aktualizowana po każdej zmianie formularza (po pierwszym obliczeniu).
- Komunikaty walidacyjne inline, bannery błędów globalnych oraz stan „brak usług”.

## 7. Wymagania UI / UX
- Styl Material Design (np. MUI): `RadioGroup`, `Select`, `TextField`, `Checkbox`, `Card`, `Snackbar`, `CircularProgress`.
- Układ desktop: dwie kolumny (formularz 5/12, wyniki 7/12); na mobile sekcje układane pionowo.
- Chip informacyjny o trybie brutto/netto, kolorystyka primary/secondary zgodna z brandem.
- Responsywny przycisk CTA „Oblicz”, loader (LinearProgress), empty state z ikoną i instrukcją.
- Typografia Roboto, ikony Material Symbols.

## 8. Integracje
- Google Apps Script (REST) – konfiguracja URL w `.env`; opcjonalny proxy API Route w Next.js do ukrycia endpointu.
- Brak dodatkowych integracji w MVP.

## 9. Dane i Model
- Produkty finansowania: `product_code`, `product_name`, `min_downpayment_pct`, `max_balloon_pct`, `max_term`, `WIBOR_Roczny`, `base_margin_pct`, `spread_pct`, `marga_dodatkowa`.
- Usługi dodatkowe: `Marka`, `Model`, `dlugosc_kontraktu`, `przebieg_roczny`, `Service_Rate`, `Tyre_Rate`, `Insurance_Rate`, `SZ_14D`.
- Przechowywanie w stanie aplikacji; brak trwałego cache w MVP.

## 10. Wymagania Techniczne
- Next.js 14+, React 18, TypeScript, ESLint + Prettier.
- Testy jednostkowe kalkulacji (Jest + React Testing Library dla komponentów formularza).
- CI (GitHub Actions) dla lint/test; możliwość wdrożenia na Vercel.
- Zmienne środowiskowe: `NEXT_PUBLIC_APPS_SCRIPT_URL`, `NEXT_PUBLIC_VAT_RATE` (opcjonalnie).

## 11. Metryki i Monitorowanie
- GA4 (lub alternatywa): liczba kalkulacji, błędy API, popularne konfiguracje.
- Logowanie błędów (Sentry / LogRocket) – etap rozszerzony.

## 12. Ryzyka i Mitigacje
- Zmiana struktury danych z Apps Script → walidacja schematu (Zod) i wersjonowanie endpointu.
- Limity Apps Script → cache po stronie Next.js (revalidate) lub CDN.
- Różnice w stawce VAT → parametryzacja przez `.env`.

## 13. Roadmapa
1. Potwierdzenie zakresu MVP i wyboru biblioteki Material.
2. Makiety hi-fi w Figma, definicja flow użytkownika.
3. Implementacja integracji + logiki kalkulacji + komponentów formularza.
4. Testy jednostkowe i QA.
5. Wdrożenie (Vercel) + konfiguracja monitoringu.
