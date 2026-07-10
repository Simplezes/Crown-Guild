import db from "@/lib/db";
import Image from "next/image";
import { getAllMonsters } from "@/lib/monsters";
import FindSearch from "./FindSearch";

async function getHostsData() {
  try {
    const monsters = await getAllMonsters();
    const crownsRes = await db.execute(`
      SELECT c.*, u.username, u.avatar_url, u.lobby_id,
             inv.remaining_uses  AS inv_remaining_uses,
             inv.monster_id      AS inv_monster_id,
             inv_m.name          AS inv_monster_name
      FROM crowns c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN investigations inv   ON c.investigation_id = inv.id
      LEFT JOIN monsters       inv_m ON inv.monster_id     = inv_m.id
      WHERE inv.remaining_uses IS NULL OR inv.remaining_uses > 0
      ORDER BY c.monster_id, c.type DESC
    `);

    const plainRows = JSON.parse(JSON.stringify(crownsRes.rows));

    const pairMonsterMap = {};
    for (const row of plainRows) {
      if (row.pair_id) {
        const key = `${row.pair_id}|${row.user_id}`;
        if (!pairMonsterMap[key]) pairMonsterMap[key] = [];
        if (!pairMonsterMap[key].find(m => m.id === row.monster_id)) {
          const pm = monsters.find(m => m.id === row.monster_id);
          if (pm) pairMonsterMap[key].push({ id: pm.id, name: pm.name, image_name: pm.image_name, emoji: pm.emoji });
        }
      }
    }

    const hosts = plainRows.map(crown => {
      const monster = monsters.find(m => m.id === crown.monster_id);

      let pair_monster = null;
      if (crown.pair_id) {
        const key = `${crown.pair_id}|${crown.user_id}`;
        const partners = (pairMonsterMap[key] || []).filter(m => m.id !== crown.monster_id);
        if (partners.length > 0) pair_monster = partners[0];
      }

      return {
        ...crown,
        monster_name: monster?.name || "Unknown Monster",
        monster_image: monster?.image_name || null,
        monster_emoji: monster?.emoji || "🐉",
        pair_monster,
      };
    });

    return { hosts };
  } catch (e) {
    console.error("Find fetch error", e);
    return { hosts: [] };
  }
}

export default async function FindPage() {
  const { hosts } = await getHostsData();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <section className="mb-8 rounded-2xl border border-white/5 bg-void-panel p-6 lg:p-8">
        <span className="inline-flex items-center gap-2 font-body text-xs uppercase tracking-[0.3em] text-ember-dim">
          <Image src="/icons/MHWilds-Expedition_Record_Board_Icon.png" width={16} height={16} alt="" className="pixel-art" />
          Quest Registry
        </span>
        <h1 className="mt-2 font-display text-3xl uppercase tracking-wide text-mist sm:text-4xl">Find a Host</h1>
        <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-mist-dim">
          Browse available investigations and connect with hunters hosting specific crown specimens.
        </p>
      </section>

      <FindSearch initialHosts={hosts} />
    </main>
  );
}
