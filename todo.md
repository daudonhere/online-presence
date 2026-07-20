# Todo

## Missing Features
- [ ] Tambah toggle `reminderPulang` di UI Pengaturan + buat cron job (sudah ada di DB/API/schema)
- [ ] Push unsubscription: toggle OFF harus bersihkan browser push subscription + server entry; gunakan hook `usePushSubscription` yang sudah ada

## Dead Code
- [ ] Hapus `useAppStore` (`src/store/useAppStore.ts`) — exported, tidak pernah dipakai
- [ ] Hapus `usePushSubscription` dari `src/lib/hooks.tsx` atau gunakan di pengaturan
- [ ] Extract `urlBase64ToUint8Array` ke shared utility (terduplikasi 3x)
- [ ] Hapus duplikasi `sanitize` — pilih di `validations.ts` atau `api-response.ts`
- [ ] Extract `MONTHS`, `downloadFile`, `formatDay` ke shared utility (duplikasi antara persetujuan/riwayat)

## UX
- [ ] Tambah error feedback saat push subscription gagal (hapus `catch {}` kosong)

## Cleanup
- [ ] Hapus `Report` table reference dari schema jika tidak dipakai
- [ ] Hapus config `reports` di `src/lib/upload.ts` jika tidak dipakai
