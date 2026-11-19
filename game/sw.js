const CACHE='imperialism-rebuild-3-255';
// Province outlines are needed by the map even when the app is offline.
const MAP_FILES=['map-borders.mjs'];
const TRADE_FILES=['cartography.mjs','coastline.mjs','news-priority.mjs','native-saleable-amount.mjs','ai-native-exports.mjs','research-art.mjs','unit-attention.mjs','sea-knowledge.mjs','fleet-map-target.mjs','location-label.mjs','diplomacy-map.mjs','map-orders.mjs'];
const FILES=['assets/industry.png','industry-art.mjs','production-plan.mjs','assets/relief.png','assets/overseas-development.png','assets/resource-sites.png','development-art.mjs','assets/development.png','data/sea-name-words.mjs','map-markers.mjs','terrain-blend.mjs','military-art.mjs','assets/military.png','assets/terrain.png','assets/atlas.png','assets/resources.png','./','index.html','style.css','app.mjs','engine.mjs','economy.mjs','ai.mjs','research.mjs','trade.mjs','navy.mjs','army.mjs','overseas.mjs','world.mjs','rules.mjs','map.mjs','data/europe.mjs','data/technology.mjs','data/native-tables.mjs','icon.svg','manifest.webmanifest'];
FILES.push(...MAP_FILES,'landscape-detail.mjs','map-art249.mjs','assets/towns-forts.png','assets/rural-landscape.png','landscape-art.mjs','assets/royal-towns.png','terrain-art.mjs','assets/royal-ground.png','assets/royal-biomes.png');
FILES.push(...TRADE_FILES,'colony-first-refusal.mjs','assets/reviewed/254-sheep.png','assets/reviewed/254-grass.png',...['tin','copper','iron','coal','swamp'].map(name=>'assets/reviewed/253-'+name+'.png'));
FILES.push('boot.js','save-recovery.mjs','save-policy.mjs','heraldry.mjs','assets/royal-regiments.png','assets/royal-desert.png','assets/royal-meadow.png','assets/royal-ocean.png');
FILES.push('royal.css','royal-ui.mjs','royal-map-art.mjs','assets/royal-frame.png','assets/royal-brocade.png','assets/royal-parchment.png','assets/royal-relief.png','assets/royal-envoys.png','assets/royal-vellum.png');
FILES.push('campaign-alliance-seeking.mjs','alliance-candidate-selection.mjs','alliance-seeking-threat.mjs');
FILES.push('city-forecast-state.mjs','city-needs.mjs','population-needs.mjs','interior-planning-state.mjs','civilian-idling.mjs');
FILES.push('transport-network-state.mjs','conquest-war-support.mjs','territorial-war-support.mjs','war-history.mjs','war-support.mjs','peace-personality.mjs','espionage.mjs','spy-native.mjs','ai-overseas-supply.mjs','ai-infrastructure.mjs','ai-transport.mjs','ai-exploration-fleet.mjs','ai-workforce.mjs','research-progress.mjs','research-eta.mjs','industrial-output.mjs','ai-siege.mjs','ai-invasion.mjs','ai-campaign.mjs','army-recovery.mjs','ai-research-goals.mjs','ai-army-upgrades.mjs','army-upgrade.mjs','ai-explorers.mjs','ai-exploration.mjs','ai-merchants.mjs','ai-exports.mjs','ai-research.mjs','war-relations.mjs','trade-relations.mjs','starting-relations.mjs','deal-priority.mjs','deal-prices.mjs','market-prices.mjs','fishing.mjs','port-construction.mjs','data/base-terrain.mjs','river-routes.mjs','data/river-routes.mjs','minor-development.mjs','trade-parties.mjs','minor-trade.mjs','town-upgrade.mjs','town-production.mjs','transport-links.mjs','starting-technology.mjs','starting-cash.mjs','data/starting-cash.mjs','starting-stock.mjs','data/starting-stock.mjs','ai-military.mjs','campaign-transport.mjs','transport-routes.mjs','campaign-merchant.mjs','merchant-routes.mjs','merchant-battle-cargo.mjs','merchant-escorts.mjs','merchant-spotting.mjs','merchant-withdrawal.mjs','naval-cargo.mjs','beachhead.mjs','campaign-finance.mjs','finance.mjs','campaign-naval.mjs','naval-battle.mjs','naval-spotting.mjs','naval-encounter.mjs','naval-leader.mjs','naval-experience.mjs','naval-decision.mjs','naval-movement.mjs','naval-exchange.mjs','naval-losses.mjs','naval-fire.mjs','naval-damage.mjs','data/naval-combat.mjs','ship-repair.mjs','fort-construction.mjs','civilian-duration.mjs','civilian-access.mjs','victory.mjs','conquest.mjs','diplomacy.mjs','battle-map.mjs','army-initiative.mjs','campaign-battle.mjs','army-retreat.mjs','army-experience.mjs','land-attack.mjs','battle-victory.mjs','battle-result.mjs','emplaced.mjs','battle.mjs','battlefield.mjs','fort.mjs','tactical.mjs','battle-ai.mjs','battle-view.mjs','battle-view.css');
FILES.push('starting-minor-armies.mjs','starting-civilians.mjs','starting-development.mjs','development-technology.mjs','riches-price.mjs','foreign-development.mjs','overseas-profit.mjs','land-purchase.mjs','land-price.mjs','resource-categories.mjs');
FILES.push('map-assign-terrain.mjs','map-capital-check.mjs','map-clear-terrain.mjs','map-continent-drift.mjs','map-gameplay-conversion.mjs','map-generation-primitives.mjs','map-historical-attempt.mjs','map-historical-records.mjs','map-historical-world.mjs','map-new-game.mjs','map-ocean.mjs','map-picture-finalization.mjs','map-province-neighbors.mjs','map-province-renumber.mjs','map-province-reset.mjs','map-province-tiles.mjs','map-provinces.mjs','map-resources.mjs','map-river-growth.mjs','map-river-picture.mjs','map-sea-growth.mjs','map-sea-merge.mjs','map-seapoints.mjs','map-terrain-growth.mjs','map-tile-reset.mjs','map-town-neighbors.mjs','map-town-selection.mjs','map-zone-adjacency.mjs','map-zone-coasts.mjs','map-zone-smoothing.mjs','map-zone-tiles.mjs','data/historical-records.mjs');
FILES.push('map-minor-capitals.mjs','map-town-relocation.mjs','minor-port-selection.mjs','data/minor-port-weights.mjs','material-debt.mjs','material-advance.mjs','resource-categories.mjs','map-province-names.mjs','data/overseas-names.mjs');
FILES.push('additional-population.mjs','allocated-domestic-routes.mjs','allocation-priority-order.mjs','army-reinforcement.mjs','campaign-demand-capacity.mjs','campaign-demand-forecast.mjs','campaign-demand-limits.mjs','campaign-development-factor.mjs','campaign-domestic-delivery.mjs','campaign-external-resources.mjs','campaign-initial-demand.mjs','campaign-port-danger.mjs','campaign-reinforcement-forecast.mjs','campaign-resource-priorities.mjs','campaign-shipping-overview.mjs','campaign-shipping-plan.mjs','campaign-shipping-snapshot.mjs','campaign-strategic-strength.mjs','campaign-transport-potential.mjs','campaign-zone-occupants.mjs','country-delivery.mjs','country-potential.mjs','demand-capacity.mjs','demand-finish.mjs','demand-initial.mjs','demand-labour.mjs','demand-limits.mjs','demand-luxury.mjs','demand-technology.mjs','development-factor.mjs','forecast-available.mjs','forecast-external-resources.mjs','forecast-stock.mjs','manufacturing-demand.mjs','navy-reinforcement.mjs','network-order.mjs','planning-food.mjs','planning-technology.mjs','port-danger.mjs','port-transport.mjs','resource-connection.mjs','resource-priorities.mjs','resource-priority-demand.mjs','resource-priority-finalization.mjs','resource-priority-stock.mjs','resource-priority-supply.mjs','resource-priority-technology.mjs','resource-traversal.mjs','riches-preference.mjs','shipping-final-fill.mjs','shipping-first-pass.mjs','shipping-food-topup.mjs','shipping-manufactured-surplus.mjs','shipping-network-allocation.mjs','shipping-network-assignment.mjs','shipping-network-supply.mjs','shipping-opening-passes.mjs','shipping-reconciliation.mjs','shipping-reserve.mjs','strategic-strength.mjs','trade-favorite.mjs','zone-occupants.mjs');
FILES.push('campaign-interior-planning.mjs','campaign-planning-context.mjs','campaign-planning-distances.mjs','campaign-resource-planning.mjs','planning-distance.mjs','planning-eligibility.mjs','planning-networks.mjs','planning-port.mjs','planning-reach.mjs','resource-planning-totals.mjs','resource-planning.mjs');
FILES.push(...["reviewed-sprites.mjs", "reviewed-sprite-data.mjs", "assets/reviewed/00c393a85b.png", "assets/reviewed/0e888b9523.png", "assets/reviewed/29ad0a4b1f.png", "assets/reviewed/42b5377de1.png", "assets/reviewed/4ad2694735.png", "assets/reviewed/4d894218df.png", "assets/reviewed/517360aefc.png", "assets/reviewed/52272a543b.png", "assets/reviewed/65a30ad622.png", "assets/reviewed/6a3e7960f9.png", "assets/reviewed/759239e87d.png", "assets/reviewed/7b3eaf9469.png", "assets/reviewed/80d4c3151d.png", "assets/reviewed/82b2b6705e.png", "assets/reviewed/84c1c3dc21.png", "assets/reviewed/90d35b9edb.png", "assets/reviewed/91b5c17379.png", "assets/reviewed/a9c66c0375.png", "assets/reviewed/be36ab3a68.png", "assets/reviewed/be811aaebc.png", "assets/reviewed/c22de5988b.png", "assets/reviewed/c5be6f5221.png", "assets/reviewed/c660a1c389.png", "assets/reviewed/cb87f6520a.png", "assets/reviewed/ea91c85168.png"]);
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll([...new Set(FILES)]))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('imperialism-rebuild-')&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return r;}).catch(()=>caches.match(e.request)));});













FILES.push('peace-offers.mjs','peace-settlement.mjs','campaign-peace-decision.mjs','peace-threat.mjs','peace-decision.mjs');

FILES.push('incoming-peace.mjs');

FILES.push('campaign-peace-seeking.mjs','peace-seeking.mjs');

FILES.push('war-call-phase.mjs','campaign-call-to-war-decision.mjs','call-to-war-response.mjs','ai-call-to-war-decision.mjs','call-to-war-personality.mjs','alliance-military-score.mjs','alliance-territorial-factor.mjs','call-to-war-modifier.mjs');

FILES.push('alliance-offers.mjs','alliance-offer-response.mjs','campaign-alliance-proposal-decision.mjs','alliance-proposal-inputs.mjs','alliance-proposal-decision.mjs');



// Reachable runtime dependencies added with offline graph verification.
FILES.push("minor-join-offers.mjs","colony-trade-policy.mjs","minor-join-acceptance.mjs","campaign-deal-price.mjs");

FILES.push('province-control.mjs');











FILES.push('diplomacy-screen.mjs','diplomatic-aid.mjs','power-rankings.mjs');

FILES.push('research-screen.mjs');

