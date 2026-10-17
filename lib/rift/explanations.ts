// Qualitative reasoning. Exact coefficients/effects are intentionally not simulated.
export const runeReasons: Record<string, string> = {
  conqueror:
    "Rewards repeated hits in an extended fight; weaker when you cannot keep contact.",
  electrocute:
    "Adds a short-combo damage window; sacrifices sustained-fight value.",
  "phase-rush":
    "Helps reposition after a combo, trading direct damage for movement.",
  "grasp-of-the-undying":
    "Favours repeat short lane trades and health growth, with less burst payoff.",
  "lethal-tempo": "Supports sustained basic attacks; needs safe attack uptime.",
  "axiom-arcanist":
    "Invests in ultimate impact for an ultimate-centred combat plan.",
  transcendence:
    "Ability haste supports repeated casts rather than one initial combo.",
  "nimbus-cloak":
    "Summoner-spell movement helps enter, stay in range or escape.",
  "legend-haste":
    "Longer-term basic-ability access; takedown-dependent scaling is not guaranteed.",
  "battle-zeal":
    "Basic-ability damage gains value as combat continues; less benefit in very short trades.",
  "last-stand":
    "Low-health damage suits a fighting sustain plan, but does not make low health safe.",
  demolish: "Converts a safe lane window into turret pressure.",
  "second-wind":
    "Helps recover from lane poke; gives up immediate offensive value.",
  overgrowth:
    "Adds health through nearby unit deaths; needs time to accumulate.",
  "sudden-impact":
    "Pairs with a kit that can trigger mobility/stealth entry; check the trigger before engaging.",
  "chain-assault":
    "Rewards following an opening spell with further attacks or active abilities.",
  "eyeball-collector":
    "Takedown-linked offensive scaling; weaker when early participation is limited.",
  "absolute-focus":
    "Favours entering at high health; loses value after being chunked.",
  "empowered-attack":
    "Adds periodic attack damage to a spell-and-attack trade; requires a safe attack.",
  "bone-plating":
    "Buffers an incoming combo window; can be baited out by a light hit.",
  brutal: "Invests in early repeated attack pressure.",
  "cut-down": "Targets healthier enemies; depends on who you can safely hit.",
  "legend-bloodline":
    "Scaling sustain rewards participation; it does not prevent a burst death.",
};
export const itemReasons: Record<string, string> = {
  malignance:
    "Ultimate-driven spell pressure; mana and repeated ultimate damage must be useful.",
  "rylais-crystal-scepter":
    "Adds sticking power for repeat spell hits; trades burst for health and control.",
  riftmaker:
    "Sustained-combat investment; needs a fight long enough to realise its value.",
  "rabadons-deathcap":
    "Amplifies the AP investment already built; expensive and offers little protection.",
  "infinity-orb":
    "Favours finishing vulnerable targets, with less defensive utility.",
  "liandrys-torment":
    "Repeated spell contact adds burn pressure; needs target access and uptime.",
  "bloodletters-curse":
    "Repeated magic hits can reduce resistance; useful into resistant frontlines.",
  morellonomicon:
    "Reduces healing when you can apply its trigger; the team may already cover this need.",
  "oceanids-trident":
    "Answers meaningful shields; shield reduction is different from anti-heal.",
  "zhonyas-hourglass":
    "An active survival window against decisive damage; timing matters and casting stops during stasis.",
  "banshees-veil":
    "Protects an entry from one spell; chip damage can remove the protection.",
  "lich-bane":
    "Rewards weaving an attack into ability trades; risky when attack range is unsafe.",
  "ludens-echo":
    "Wave and spell burst pressure; verify mana value and target reach.",
  "hextech-rocketbelt":
    "Provides a controlled entry/reposition option; does not replace tracking enemy CC.",
  "amaranths-twinguard":
    "Rewards surviving into an extended fight; trades immediate damage for durability.",
  heartsteel:
    "Long-horizon health stacking; cannot assume stacks or a fixed completion time.",
  "sunfire-aegis":
    "Close-range sustained pressure; weaker when enemies kite outside its effective range.",
  "titanic-hydra":
    "Converts a health-heavy attack pattern into more damage; requires attack uptime.",
  "force-of-nature":
    "Specialises against sustained magic pressure, sacrificing offensive value.",
  "warmogs-armor":
    "Recovery between engagements only if its activation requirements are met; 7.3b requires 1250 bonus health for Heart.",
  "yun-tal-wildarrows":
    "A scaling crit attack foundation; needs attacks/time to develop its critical chance.",
  "infinity-edge":
    "A crit damage spike after a crit foundation; costly and low in defence.",
  "runaans-hurricane":
    "Spreads attack pressure across targets; less useful when only one target is reachable.",
  "rapid-firecannon":
    "Adds a safer ranged attack window; trades sustained multi-target damage for reach.",
  "mortal-reminder":
    "Combines armour penetration and anti-heal; useful only when the targets need those answers.",
  bloodthirster:
    "Sustain through safe attacks; cannot help while controlled or unable to hit.",
  "guardian-angel":
    "Revive insurance when allies can protect the return; does not justify isolated deaths.",
};
export const spellReasons: Record<string, string> = {
  Flash: "Reposition across a key threat or reach a decisive target.",
  Ghost:
    "Maintain contact or kite through a longer fight; sacrifices a direct damage/protection spell.",
  Smite: "Secure jungle resources and objectives on the Rift.",
  Ignite:
    "Commit to a close-range finishing/anti-heal window; gives up defensive utility.",
  Exhaust:
    "Reduce a threatening carry’s immediate impact and protect a teammate or your own entry.",
};
