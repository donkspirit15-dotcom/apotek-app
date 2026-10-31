import CrudPage from '../components/CrudPage';

const rp = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

export const Obat = () => (
  <CrudPage table="obat" title="Data obat"
    columns={[
      { key: 'kode', label: 'Kode' }, { key: 'nama', label: 'Nama obat' }, { key: 'kategori', label: 'Kategori' },
      { key: 'satuan', label: 'Satuan' }, { key: 'harga_beli', label: 'Harga beli', format: rp },
      { key: 'harga_jual', label: 'Harga jual', format: rp }, { key: 'stok_min', label: 'Stok min.' },
    ]}
    fields={[
      { key: 'kode', label: 'Kode obat' }, { key: 'nama', label: 'Nama obat' },
      { key: 'kategori', label: 'Kategori' },
      { key: 'satuan', label: 'Satuan', options: ['Tablet', 'Strip', 'Box', 'Botol', 'Tube', 'Pcs'] },
      { key: 'harga_beli', label: 'Harga beli', type: 'number' }, { key: 'harga_jual', label: 'Harga jual', type: 'number' },
      { key: 'stok_min', label: 'Stok minimum', type: 'number' },
    ]} />
);

export const Kategori = () => (
  <CrudPage table="kategori" title="Kategori"
    columns={[{ key: 'nama', label: 'Nama kategori' }]}
    fields={[{ key: 'nama', label: 'Nama kategori', wide: true }]} />
);

export const Supplier = () => (
  <CrudPage table="supplier" title="Supplier"
    columns={[{ key: 'nama', label: 'Nama' }, { key: 'telepon', label: 'Telepon' }, { key: 'alamat', label: 'Alamat' }]}
    fields={[
      { key: 'nama', label: 'Nama supplier', wide: true }, { key: 'telepon', label: 'Telepon' },
      { key: 'alamat', label: 'Alamat', required: false },
    ]} />
);
