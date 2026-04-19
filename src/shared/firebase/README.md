# Firebase Integration Notes

Layer ini disiapkan untuk implementasi:

- `auth`: login, register, session, family membership lookup
- `firestore`: repository per entity household
- `storage`: avatar dan attachment
- `functions`: spreadsheet sync, monthly summaries, recurring transactions, reminders

File yang sudah disiapkan:

- `config.js` untuk membaca env Vite frontend

Rekomendasi file saat wiring penuh:

- `authRepository.js`
- `familyRepository.js`
- `transactionRepository.js`
- `syncRepository.js`

Frontend env dibaca dari root `.env` dengan prefix `VITE_`.
