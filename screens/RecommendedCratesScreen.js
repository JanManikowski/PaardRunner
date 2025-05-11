import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';

const BIG_CRATE_CAPACITY = 42;
const POINTS_PER_CATEGORY = { Fridge: 1, Shelves: 4, Strong: 4 };

const RecommendedCratesScreen = ({ route }) => {
  const { bar } = route.params || {};
  const { theme } = useContext(ThemeContext);

  const [recommendedCrates, setRecommendedCrates] = useState([]);
  const [customCrates, setCustomCrates] = useState([]);
  const [missingItemsState, setMissingItemsState] = useState({});
  const [isBigCrate, setIsBigCrate] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // load custom crates (now each has `.categories: string[]`)
        const stored = JSON.parse(
          await AsyncStorage.getItem(`customCrates_${bar.orgId}`)
        ) || [];
        setCustomCrates(stored);

        const missing = await fetchMissingItems(bar);
        setMissingItemsState(missing);

        setRecommendedCrates(
          isBigCrate
            ? generateBigCrates(missing)
            : generateRecommendedCrates(missing, stored)
        );
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, [bar, isBigCrate]);

  // re-generate whenever missingItems or toggle changes
  useEffect(() => {
    if (!missingItemsState) return;
    setRecommendedCrates(
      isBigCrate
        ? generateBigCrates(missingItemsState)
        : generateRecommendedCrates(missingItemsState, customCrates)
    );
  }, [isBigCrate, missingItemsState, customCrates]);

  // fetch missing counts
  const fetchMissingItems = async (bar) => {
    const byCat = {};
    const cats =
      JSON.parse(await AsyncStorage.getItem(`categories_${bar.orgId}`)) || [];
    for (let c of cats) {
      for (let item of c.items || []) {
        const key = `missing_${item.id}_${bar.orgId}_${bar.name}`;
        const val = await AsyncStorage.getItem(key);
        const missing = val ? parseInt(val, 10) : 0;
        if (missing > 0) {
          byCat[c.name] = byCat[c.name] || [];
          byCat[c.name].push({ ...item, missing });
        }
      }
    }
    return byCat;
  };

  // ORIGINAL algorithm, but now each crateConfig.categories is an array
  const generateRecommendedCrates = (missingItems, crateConfigs) => {
    const result = [];
    crateConfigs.forEach((cfg) => {
      // support both old single `category` and new `categories[]`
      const cats = Array.isArray(cfg.categories)
        ? cfg.categories
        : [cfg.category];

      // flatten all items from each selected category
      let pool = cats
        .flatMap((cat) =>
          (missingItems[cat] || []).map((i) => ({ ...i, category: cat }))
        )
        .filter((i) => i.missing > 0);
      if (!pool.length) return;

      // keep generating crates until nothing left
      while (pool.some((i) => i.missing > 0)) {
        let current = [];
        let count = 0;
        while (
          count < cfg.maxItems &&
          pool.some((i) => i.missing > 0)
        ) {
          const candidates = pool.filter((i) => i.missing > 0);
          candidates.forEach((i) => {
            i.priority = i.missing / i.maxAmount;
          });
          const maxP = Math.max(...candidates.map((i) => i.priority));
          let top = candidates.filter((i) => i.priority === maxP);
          top.sort((a, b) => {
            const qa = current.find((x) => x.id === a.id)?.quantity || 0;
            const qb = current.find((x) => x.id === b.id)?.quantity || 0;
            return qa - qb;
          });
          const pick = top[0];
          const idx = current.findIndex((x) => x.id === pick.id);
          if (idx >= 0) current[idx].quantity += 1;
          else
            current.push({
              id: pick.id,
              type: pick.name,
              quantity: 1,
              image: pick.image || null,
            });
          pick.missing -= 1;
          count += 1;
        }
        if (current.length) {
          result.push({
            crateName: `${cfg.name} - Crate ${result.length + 1}`,
            // show joined category names
            category: cats.join(', '),
            items: current,
          });
        }
      }
    });
    return result;
  };

  // BIG crate stays the same
  const generateBigCrates = (missingItems) => {
    const flat = [];
    Object.entries(missingItems).forEach(([cat, items]) =>
      items.forEach((i) =>
        flat.push({ ...i, category: cat, priority: i.missing / i.maxAmount })
      )
    );
    const pool = flat.map((i) => ({ ...i }));
    const crates = [];
    let idx = 1;
    while (
      pool.some(
        (i) => i.missing > 0 && POINTS_PER_CATEGORY[i.category] <= BIG_CRATE_CAPACITY
      )
    ) {
      let used = 0;
      const curr = [];
      while (used < BIG_CRATE_CAPACITY) {
        const cand = pool
          .filter(
            (i) =>
              i.missing > 0 &&
              (POINTS_PER_CATEGORY[i.category] || 1) <= BIG_CRATE_CAPACITY - used
          )
          .map((i) => {
            i.priority = i.missing / i.maxAmount;
            return i;
          });
        if (!cand.length) break;
        const maxP = Math.max(...cand.map((i) => i.priority));
        let top = cand.filter((i) => i.priority === maxP);
        top.sort((a, b) => {
          const qa = curr.find((x) => x.id === a.id)?.quantity || 0;
          const qb = curr.find((x) => x.id === b.id)?.quantity || 0;
          return qa - qb;
        });
        const pick = top[0];
        const cost = POINTS_PER_CATEGORY[pick.category] || 1;
        const fidx = curr.findIndex((x) => x.id === pick.id);
        if (fidx >= 0) curr[fidx].quantity += 1;
        else
          curr.push({
            id: pick.id,
            type: pick.name,
            quantity: 1,
            image: pick.image || null,
          });
        pick.missing -= 1;
        used += cost;
      }
      crates.push({
        crateName: `Big Crate - Crate ${idx++}`,
        category: 'Big Crate',
        items: curr,
        usedPoints: used,
      });
    }
    return crates;
  };

  const handleDeleteCrateItems = (crate) => {
    Alert.alert(
      'Delete Crate Items',
      `Remove items from ${crate.crateName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            for (let item of crate.items) {
              const key = `missing_${item.id}_${bar.orgId}_${bar.name}`;
              const val = await AsyncStorage.getItem(key);
              if (!val) continue;
              const cur = parseInt(val, 10);
              const delta = item.quantity;
              const next = cur - delta;
              if (next <= 0) await AsyncStorage.removeItem(key);
              else await AsyncStorage.setItem(key, next.toString());
            }
            setRecommendedCrates((prev) =>
              prev.filter((r) => r.crateName !== crate.crateName)
            );
            Alert.alert('Success', 'Crate items removed.');
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={{
        flex: 1,
        padding: 16,
        backgroundColor: theme.colors.background,
      }}
    >
      <Text
        style={{
          fontSize: 26,
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: 16,
          color: theme.colors.text,
        }}
      >
        Recommended Crates for {bar.name}
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            marginRight: 8,
            color: theme.colors.text,
          }}
        >
          Big Crate
        </Text>
        <Switch
          value={isBigCrate}
          onValueChange={setIsBigCrate}
          trackColor={{ true: theme.colors.primary }}
        />
      </View>

      {recommendedCrates.length > 0 ? (
        recommendedCrates.map((crate, i) => {
          const totalQty = crate.items.reduce((s, x) => s + x.quantity, 0);
          const def = customCrates.find(
            (c) => c.name === crate.crateName.split(' - ')[0]
          );
          const maxItems = def?.maxItems ?? 0;
          const pct = maxItems ? (totalQty / maxItems) * 100 : 0;

          const usedPts = crate.usedPoints ?? 0;
          const ptsPct = (usedPts / BIG_CRATE_CAPACITY) * 100;

          return (
            <TouchableOpacity
              key={i}
              style={{
                borderRadius: 10,
                padding: 16,
                marginBottom: 20,
                backgroundColor: theme.colors.surfaceVariant,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
              onLongPress={() => handleDeleteCrateItems(crate)}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  marginBottom: 4,
                  color: theme.colors.text,
                }}
              >
                {crate.crateName}{' '}
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: 'normal',
                    color: theme.colors.text,
                  }}
                >
                  ({crate.category})
                </Text>
              </Text>

              {isBigCrate ? (
                <>
                  <Text style={{ fontSize: 14, color: '#999', marginBottom: 6 }}>
                    Points Used: {usedPts}/{BIG_CRATE_CAPACITY}
                  </Text>
                  <View
                    style={{
                      height: 10,
                      width: '100%',
                      backgroundColor: '#ccc',
                      borderRadius: 5,
                      overflow: 'hidden',
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        height: '100%',
                        width: `${ptsPct}%`,
                        backgroundColor: theme.colors.primary,
                      }}
                    />
                  </View>
                </>
              ) : (
                maxItems > 0 && (
                  <>
                    <Text style={{ fontSize: 14, color: '#999', marginBottom: 6 }}>
                      {totalQty}/{maxItems} Items Used
                    </Text>
                    <View
                      style={{
                        height: 10,
                        width: '100%',
                        backgroundColor: '#ccc',
                        borderRadius: 5,
                        overflow: 'hidden',
                        marginBottom: 8,
                      }}
                    >
                      <View
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          backgroundColor: theme.colors.primary,
                        }}
                      />
                    </View>
                  </>
                )
              )}

              <View style={{ height: 1, backgroundColor: '#ccc', marginVertical: 6 }} />

              {crate.items.map((it, idx2) => (
                <View
                  key={idx2}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  {it.image ? (
                    <Image
                      source={{ uri: it.image }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        marginRight: 10,
                        backgroundColor: '#fff',
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        marginRight: 10,
                        backgroundColor: '#ccc',
                      }}
                    />
                  )}
                  <Text
                    style={{
                      fontSize: 16,
                      flexShrink: 1,
                      color: theme.colors.text,
                    }}
                  >
                    {it.type} x{it.quantity}
                  </Text>
                </View>
              ))}
            </TouchableOpacity>
          );
        })
      ) : (
        <Text
          style={{
            fontSize: 18,
            fontStyle: 'italic',
            textAlign: 'center',
            marginTop: 20,
            color: theme.colors.text,
          }}
        >
          No recommended crates available.
        </Text>
      )}
    </ScrollView>
  );
};

export default RecommendedCratesScreen;
