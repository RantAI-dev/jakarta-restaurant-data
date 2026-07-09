import { syncDataset } from "../lib/sync";
import { SDI_DATASETS } from "../lib/sdi";

async function main() {
  const arg = process.argv[2];
  const slugs = arg && arg !== "all" ? [arg] : SDI_DATASETS.map((x) => x.slug);
  console.log(`Sync ${slugs.length} dataset…`);
  let ok = 0;
  for (const slug of slugs) {
    try {
      const n = await syncDataset(slug);
      ok++;
      console.log(`  ✓ ${slug}: ${n} baris`);
    } catch (e) {
      console.log(`  ✗ ${slug}: ${String(e)}`);
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  console.log(`Selesai: ${ok}/${slugs.length} dataset tersync.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });