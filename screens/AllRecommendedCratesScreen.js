import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { ThemeContext } from '../contexts/ThemeContext';

const BIG_CRATE_CAPACITY = 42;
const POINTS_PER_CATEGORY = { Fridge: 1, Shelves: 4, Strong: 4 };

const AllRecommendedCratesScreen = () => {
  const { theme } = useContext(ThemeContext);
  const [missingItems, setMissingItems] = useState({});
  const [customCrates, setCustomCrates] = useState([]);
  const [recommendedCrates, setRecommendedCrates] = useState([]);
  const [isBigCrate, setIsBigCrate] = useState(false);

  // Load custom crate configurations once
  useEffect(() => {
    (async () => {
      const orgId = await AsyncStorage.getItem('activeOrgId');
      if (!orgId) return;
      const stored =
        JSON.parse(await AsyncStorage.getItem(`customCrates_${orgId}`)) ||
        [];
      setCustomCrates(stored);
    })();
  }, []);

  // Fetch aggregated missing items across all bars
  const fetchAggregatedMissingItems = useCallback(async () => {
    const orgId = await AsyncStorage.getItem('activeOrgId');
    if (!orgId) {
      setMissingItems({});
      return;
    }
    const barsJSON = await AsyncStorage.getItem(`bars_${orgId}`);
    const bars = barsJSON ? JSON.parse(barsJSON) : [];
    const itemsJSON = await AsyncStorage.getItem(`items_${orgId}`);
    const itemsList = itemsJSON ? JSON.parse(itemsJSON) : [];

    const agg = {};
    for (const bar of bars) {
      for (const item of itemsList) {
        const key = `missing_${item.id}_${bar.orgId}_${bar.name}`;
        const saved = await AsyncStorage.getItem(key);
        const missing = saved ? parseInt(saved, 10) : 0;
        if (missing > 0) {
          const category = item.categoryName || 'Uncategorized';
          if (!agg[category]) agg[category] = [];
          const exist = agg[category].find(i => i.id === item.id);
          if (exist) {
            exist.missing += missing;
          } else {
            agg[category].push({ ...item, missing });
          }
        }
      }
    }
    setMissingItems(agg);
  }, []);

  // Re-fetch whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchAggregatedMissingItems();
    }, [fetchAggregatedMissingItems])
  );

  // Regenerate crates when data or toggle changes
  useEffect(() => {
    if (Object.keys(missingItems).length === 0) {
      setRecommendedCrates([]);
      return;
    }
    if (isBigCrate) {
      setRecommendedCrates(generateBigCrates(missingItems));
    } else {
      setRecommendedCrates(
        generateRecommendedCrates(missingItems, customCrates)
      );
    }
  }, [missingItems, customCrates, isBigCrate]);

  // Algorithm: fill custom crates by unit-priority
  const generateRecommendedCrates = (missingItems, crateConfigs) => {
    const result = [];
    crateConfigs.forEach(cfg => {
      const cats = Array.isArray(cfg.categories)
        ? cfg.categories
        : [cfg.category];
      // flatten pool
      let pool = cats
        .flatMap(cat =>
          (missingItems[cat] || []).map(i => ({ ...i, category: cat }))
        )
        .filter(i => i.missing > 0);
      if (!pool.length) return;

      while (pool.some(i => i.missing > 0)) {
        let current = [];
        let count = 0;
        while (
          count < cfg.maxItems &&
          pool.some(i => i.missing > 0)
        ) {
          pool.forEach(i => {
            i.priority = i.missing / i.maxAmount;
          });
          const maxP = Math.max(
            ...pool.filter(i => i.missing > 0).map(i => i.priority)
          );
          let top = pool.filter(
            i => i.missing > 0 && i.priority === maxP
          );
          top.sort((a, b) => {
            const qa = current.find(x => x.id === a.id)?.quantity || 0;
            const qb = current.find(x => x.id === b.id)?.quantity || 0;
            return qa - qb;
          });
          const pick = top[0];
          const idx = current.findIndex(x => x.id === pick.id);
          if (idx >= 0) {
            current[idx].quantity += 1;
          } else {
            current.push({
              id: pick.id,
              type: pick.name,
              quantity: 1,
              image: pick.image || null,
            });
          }
          pick.missing -= 1;
          count += 1;
        }
        if (current.length) {
          result.push({
            crateName: `${cfg.name} - Crate ${result.length + 1}`,
            category: cats.join(', '),
            items: current,
          });
        }
      }
    });
    return result;
  };

  // Algorithm: fill one or more big crates by points
  const generateBigCrates = missingItems => {
    const flat = [];
    Object.entries(missingItems).forEach(([cat, items]) =>
      items.forEach(i => flat.push({ ...i, category: cat }))
    );
    const pool = flat.map(i => ({ ...i }));
    const crates = [];
    let idx = 1;

    while (
      pool.some(
        i =>
          i.missing > 0 &&
          (POINTS_PER_CATEGORY[i.category] || 1) <= BIG_CRATE_CAPACITY
      )
    ) {
      let used = 0;
      const current = [];
      while (used < BIG_CRATE_CAPACITY) {
        const candidates = pool.filter(
          i =>
            i.missing > 0 &&
            (POINTS_PER_CATEGORY[i.category] || 1) <=
              BIG_CRATE_CAPACITY - used
        );
        if (!candidates.length) break;
        candidates.forEach(i => {
          i.priority = i.missing / i.maxAmount;
        });
        const maxP = Math.max(...candidates.map(i => i.priority));
        let top = candidates.filter(i => i.priority === maxP);
        top.sort((a, b) => {
          const qa = current.find(x => x.id === a.id)?.quantity || 0;
          const qb = current.find(x => x.id === b.id)?.quantity || 0;
          return qa - qb;
        });
        const pick = top[0];
        const cost = POINTS_PER_CATEGORY[pick.category] || 1;
        const idxCurr = current.findIndex(x => x.id === pick.id);
        if (idxCurr >= 0) {
          current[idxCurr].quantity += 1;
        } else {
          current.push({
            id: pick.id,
            type: pick.name,
            quantity: 1,
            image: pick.image || null,
          });
        }
        pick.missing -= 1;
        used += cost;
      }
      crates.push({
        crateName: `Big Crate - Crate ${idx++}`,
        category: 'Big Crate',
        items: current,
        usedPoints: used,
      });
    }

    return crates;
  };

  // Long-press to remove crate items (subtracts missing across bars)
  const handleDeleteCrateItems = crate => {
    Alert.alert(
      'Delete Crate Items',
      `Remove items for ${crate.crateName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const orgId = await AsyncStorage.getItem('activeOrgId');
            const barsJSON = await AsyncStorage.getItem(`bars_${orgId}`);
            const bars = barsJSON ? JSON.parse(barsJSON) : [];
            for (const item of crate.items) {
              let toRemove = item.quantity;
              for (const bar of bars) {
                if (toRemove <= 0) break;
                const key = `missing_${item.id}_${bar.orgId}_${bar.name}`;
                const stored = await AsyncStorage.getItem(key);
                let curr = stored ? parseInt(stored, 10) : 0;
                if (curr > 0) {
                  const delta = Math.min(curr, toRemove);
                  const next = curr - delta;
                  if (next <= 0) await AsyncStorage.removeItem(key);
                  else
                    await AsyncStorage.setItem(key, next.toString());
                  toRemove -= delta;
                }
              }
            }
            await fetchAggregatedMissingItems();
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
        backgroundColor: theme.colors.background,
        padding: 16,
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: 20,
          color: theme.colors.text,
        }}
      >
        All Recommended Crates
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
            color: theme.colors.text,
            marginRight: 8,
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
          const totalQty = crate.items.reduce(
            (sum, x) => sum + x.quantity,
            0
          );
          const crateDef = customCrates.find(
            c => c.name === crate.crateName.split(' - ')[0]
          );
          const maxItems = isBigCrate
            ? BIG_CRATE_CAPACITY
            : crateDef?.maxItems || 0;
          const used = isBigCrate ? crate.usedPoints : totalQty;
          const usedPercent =
            maxItems > 0
              ? Math.min(100, (used / maxItems) * 100)
              : 0;

          return (
            <TouchableOpacity
              key={i}
              onLongPress={() => handleDeleteCrateItems(crate)}
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

              <Text
                style={{
                  fontSize: 14,
                  color: '#999',
                  marginBottom: 6,
                }}
              >
                {isBigCrate
                  ? `Points Used: ${used}/${BIG_CRATE_CAPACITY}`
                  : `${used}/${maxItems} Items Used`}
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
                    width: `${usedPercent}%`,
                    backgroundColor: theme.colors.primary,
                  }}
                />
              </View>

              <View
                style={{
                  height: 1,
                  backgroundColor: '#ccc',
                  marginVertical: 6,
                }}
              />

              {crate.items.map((itm, idx2) => (
                <View
                  key={idx2}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  {itm.image ? (
                    <Image
                      source={{ uri: itm.image }}
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
                    {itm.type} x{itm.quantity}
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
            color: theme.colors.text,
          }}
        >
          No recommended crates available.
        </Text>
      )}
    </ScrollView>
  );
};

export default AllRecommendedCratesScreen;
