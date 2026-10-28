let BREAD_DATA = null;

async function loadData() {
  const res = await fetch('data/bread.json');
  BREAD_DATA = await res.json();
}
