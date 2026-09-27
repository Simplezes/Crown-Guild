import { getAllMonsters } from "@/lib/monsters";
import { auth } from "@/auth";
import db from "@/lib/db";
import MonstersBoard from "@/components/registry/MonstersBoard";

export const metadata = { title: "Monsters | Crown Guild" };

export default async function FieldGuide({ searchParams }) {
  const search = await searchParams;
  const session = await auth();
  let userCrowns = [];
  let userWishlist = [];

  const [demandRes, allMonsters, userRows, crownsRes] = await Promise.all([
    db.execute(`SELECT monster_id, COUNT(*) as count FROM wishlist GROUP BY monster_id`),
    getAllMonsters(true),
    session?.user?.id
      ? Promise.all([
          db.execute({ sql: "SELECT monster_id, type FROM crowns WHERE user_id = ?", args: [session.user.id] }),
          db.execute({ sql: "SELECT monster_id, type FROM wishlist WHERE user_id = ?", args: [session.user.id] }),
        ]).catch((e) => {
          console.error("Failed to fetch user data for field guide", e);
          return null;
        })
      : null,
    db.execute(`SELECT monster_id, type, COUNT(*) as count FROM crowns GROUP BY monster_id, type`),
  ]);

  if (userRows) {
    userCrowns = userRows[0].rows.map(r => ({ ...r }));
    userWishlist = userRows[1].rows.map(r => ({ ...r }));
  }

  const demandMap = {};
  demandRes.rows.forEach(r => demandMap[r.monster_id] = r.count);

  const crownCountMap = {};
  crownsRes.rows.forEach(r => {
    if (!crownCountMap[r.monster_id]) crownCountMap[r.monster_id] = { small: 0, large: 0 };
    crownCountMap[r.monster_id][r.type] = Number(r.count);
  });

  const monsters = allMonsters.map(m => {
    const hasSmall = userCrowns.some(c => c.monster_id === m.id && c.type === 'small');
    const hasLarge = userCrowns.some(c => c.monster_id === m.id && c.type === 'large');
    const isCompleted = hasSmall && hasLarge;

    const wishEntry = userWishlist.find(w => w.monster_id === m.id);

    const mine = {
      s: userCrowns.filter((c) => c.monster_id === m.id && c.type === "small").length,
      l: userCrowns.filter((c) => c.monster_id === m.id && c.type === "large").length,
    };

    return {
      ...m,
      mine,
      isCompleted,
      isWishlisted: !!wishEntry,
      wishlistType: wishEntry?.type || null,
      demand: demandMap[m.id] || 0,
      hostCount: crownCountMap[m.id] || { small: 0, large: 0 }
    };
  });

  return <MonstersBoard monsters={monsters} signedIn={!!session?.user?.id} />;
}
