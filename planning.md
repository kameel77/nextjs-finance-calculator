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
- Panel zarządzania danymi (produkty, samochody, usługi) dostępny z poziomu aplikacji, synchronizujący zmiany z Apps Script.

## 4. Poza Zakresem (MVP)
- Autoryzacja użytkowników.
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
- Moduł CRUD dla danych źródłowych (produkty, usługi, samochody) z walidacją formularzy, możliwością importu/eksportu i potwierdzeniem zapisu.

## 7. Wymagania UI / UX
- Styl Material Design (np. MUI): `RadioGroup`, `Select`, `TextField`, `Checkbox`, `Card`, `Snackbar`, `CircularProgress`.
- Układ desktop: dwie kolumny (formularz 5/12, wyniki 7/12); na mobile sekcje układane pionowo.
- Chip informacyjny o trybie brutto/netto, kolorystyka primary/secondary zgodna z brandem.
- Responsywny przycisk CTA „Oblicz”, loader (LinearProgress), empty state z ikoną i instrukcją.
- Typografia Roboto, ikony Material Symbols.

## 8. Integracje
- Google Apps Script (REST) – konfiguracja URL w `.env`; opcjonalny proxy API Route w Next.js do ukrycia endpointu.
- Obsługa operacji zapisu: `POST/PUT/DELETE {APPS_SCRIPT_URL}?action=...` z tokenem serwisowym i limitami rate limiting.
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

## 14. Zakres Danych (Google Sheets)
- Arkusz źródłowy: `https://docs.google.com/spreadsheets/d/1g1zHJ_9MNJVa4JnzexAApJvQ1m8WEh4mZRlgFfvHa-M/edit` (4 zakładki).
- `Produkty_Kredyt`: kolumny `product_code`, `product_name`, `WIBOR_Roczny`, `base_margin_pct`, `spread_pct`, `min_downpayment_pct`, `max_term`, `max_balloon_pct`, `marga_dodatkowa`. Wartości liczbowe w formacie dziesiętnym (kropka). Utrzymywać unikalność `product_code`.
- `Produkty_Leasing`: struktura analogiczna do kredytu (różne marże i limity). Wymaga wspólnego interfejsu w kodzie oraz flagi typu produktu.
- `Uslugi`: kolumny `Marka`, `Model`, `dlugosc_kontraktu`, `przebieg_roczny`, `Insurance_Rate`, `Tyre_Rate`, `Service_Rate`, `SZ_14D`. Rekordy zależne od kombinacji (marka, model, długość kontraktu, przebieg). Liczba rekordów ≈ 600; należy zapewnić filtrowanie i paginację.
- `Samochody`: słownik par `Marka` + `Model` wykorzystywany do autouzupełniania list. Powiązany z listą usług; zmianę modelu trzeba propagować do usług.
- Wymagania dla panelu zarządzania danymi: walidacja typów, blokada duplikatów, możliwość dodania nowego produktu/usługi/samochodu, log zmian (timestamp + użytkownik).
- Synchronizacja zmian z Apps Script: operacje `create/update/delete` powinny aktualizować właściwe zakładki oraz odświeżać cache w aplikacji.

## 15. Epiki i Odpowiedzialności
| Epic | Zakres | Definition of Done |
| --- | --- | --- |
| Fundamenty & Integracja | Konfiguracja Next.js 14, MUI, env, proxy API, klient HTTP z retry, Zod do walidacji odpowiedzi | Repo skonfigurowane, zmienne `.env` opisane, smoke test API `getAll` przechodzi, pipeline CI działa |
| Silnik kalkulacji | Implementacja algorytmu rat, podatków, walidacji zależnych od produktu, testy jednostkowe | Testy jednostkowe pokrywają główne scenariusze, funkcje czystego obliczania niezależne od UI |
| UI Formularza i Wyników | Formularz parametrów, walidacje inline, karty wynikowe, loader/błędy, empty state | UX zgodny z makietami, dostępność (ARIA) podstawowa, brak błędów ESLint/Prettier |
| Panel Danych | Lista, wyszukiwarka, formularze CRUD dla produktów/usług/samochodów, synchronizacja z Apps Script | Operacje CRUD działają end-to-end, walidacje w UI i backendzie, potwierdzenia zmian, log audytowy minimalny |
| Jakość i Monitoring | Testy RTL, automaty dla panelu, konfiguracja GA4 / Sentry (stub), dokumentacja wdrożeniowa | Coverage kalkulacji ≥80%, dashboard błędów skonfigurowany, README uzupełnione o procedury |

## 16. Harmonogram MVP (3 Sprinty / 2 tygodnie)
| Sprint | Cel | Kluczowe deliverables | Ryzyka/Zależności |
| --- | --- | --- | --- |
| Sprint 1 | Fundamenty + integracja danych | Konfiguracja repo, fetch `getAll`, model danych, makiety UX potwierdzone | Dostęp do Apps Script, spójność schematu |
| Sprint 2 | Silnik kalkulacji + UI doradcy | Implementacja kalkulacji, formularz, wyniki, testy jednostkowe | Kalibracja algorytmu z interesariuszami |
| Sprint 3 | Panel danych + stabilizacja | CRUD panel, zabezpieczenia, QA, monitoring, przygotowanie wydania | Limit API Apps Script, autoryzacja panelu |

## 17. Backlog Startowy
| ID | Zadanie | Powiązany Epic | Priorytet | Est. (MD) |
| --- | --- | --- | --- | --- |
| BL-01 | Skonfigurować repo (Next.js, TypeScript, MUI, ESLint/Prettier) | Fundamenty & Integracja | Wysoki | 1 |
| BL-02 | Zaimplementować klienta API z walidacją schematu (Zod) | Fundamenty & Integracja | Wysoki | 1.5 |
| BL-03 | Odwzorować algorytm kalkulacji rat i balonu (testy) | Silnik kalkulacji | Wysoki | 2 |
| BL-04 | Zbudować formularz parametrów z walidacjami zależnymi | UI Formularza i Wyników | Wysoki | 2 |
| BL-05 | Przygotować komponent wyników (karty, netto/brutto, błędy) | UI Formularza i Wyników | Średni | 1.5 |
| BL-06 | Zaprojektować API route proxy + auth token dla Apps Script | Fundamenty & Integracja | Średni | 1 |
| BL-07 | Utworzyć panel listy danych (tabela z filtrami, paginacja) | Panel Danych | Wysoki | 2 |
| BL-08 | Formularze CRUD + walidacja dla produktów/usług | Panel Danych | Wysoki | 2 |
| BL-09 | Mechanizm logowania zmian + historia użytkownika | Panel Danych | Średni | 1.5 |
| BL-10 | Skonfigurować GA4/Sentry i dashboard operacyjny | Jakość i Monitoring | Niski | 1 |

## 18. Lista Kontrolna Środowiska i Konfiguracji
- Node 18+ (zgodny z wymaganiami Next.js 14), pnpm/ npm zgodny z projektem.
- Zmienna `NEXT_PUBLIC_APPS_SCRIPT_URL` oraz token dostępu do operacji zapisu (`APPS_SCRIPT_WRITE_TOKEN`).
- Dostęp do arkusza Google i Apps Script (rola edytora) dla środowisk DEV/PROD.
- Sekrety CI (GitHub Actions) dla URL/tokenów i ewentualnego konta GA4/Sentry.
- Procedura backupu arkusza (eksport CSV/XLSX) przed wdrożeniem zmian z panelu.

## 19. Kwestie Otwarte
- Model autoryzacji panelu danych (SSO, hasło jednorazowe, Basic Auth) – do decyzji przed Sprintem 2.
- Strategia konfliktów równoległych edycji (optimistic locking vs. wersjonowanie rekordów).
- Limit dodatkowych usług / pól w arkuszu – czy planowane są kolejne kolumny wymagające elastycznego UI?
- Docelowa częstotliwość synchronizacji cache po zmianach (natychmiastowy purge vs. planowe odświeżanie).
