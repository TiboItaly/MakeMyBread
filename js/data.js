let BREAD_DATA = null;
const SITE_VERSION = 'v3';

async function loadData() {
  const res = await fetch('data/bread.json?v=' + SITE_VERSION);
  BREAD_DATA = await res.json();
}
