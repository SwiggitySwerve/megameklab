export interface ApplicationSettingsDto {
    // Technology Rules
    /** If true, technology availability is restricted by year and other tech settings. Corresponds to CConfig.TECH_PROGRESSION */
    tech_progression_active?: boolean;
    /** If true, a specific year is used for tech availability rather than a general era. Corresponds to CConfig.TECH_USE_YEAR */
    tech_use_specific_year?: boolean;
    /** The specific year used for tech availability if tech_use_specific_year is true. Corresponds to CConfig.TECH_YEAR */
    tech_current_year?: number;
    /** If true, technology that is considered "extinct" may still be shown/used. Corresponds to CConfig.TECH_EXTINCT */
    tech_show_extinct?: boolean;
    /** If true, unofficial equipment that does not have an introduction year can be used. Corresponds to CConfig.TECH_UNOFFICAL_NO_YEAR */
    tech_allow_unofficial_without_year?: boolean;
    /** If true, technology availability is filtered by the selected faction's typical tech. Corresponds to CConfig.TECH_SHOW_FACTION */
    tech_filter_by_faction?: boolean;

    // Display & Editor Preferences
    /** If true, the unit summary display uses a TRO-like format. Corresponds to CConfig.MISC_SUMMARY_FORMAT_TRO */
    display_summary_use_tro_format?: boolean;
    /** If true, unit quirks are shown in displays. Corresponds to CConfig.RS_SHOW_QUIRKS */
    display_show_quirks?: boolean;
    /** If true, the era of the unit is shown in displays. Corresponds to CConfig.RS_SHOW_ERA */
    display_show_era?: boolean;
    /** If true, the unit's role is shown in displays. Corresponds to CConfig.RS_SHOW_ROLE */
    display_show_role?: boolean;
    /** Determines the type of heat profile to display. Corresponds to CConfig.RS_HEAT_PROFILE */
    display_heat_profile_type?: 'None' | 'Standard' | 'TacticalOps'; // Example based on common heat display types
    /** Determines the order in which weapons are listed. Corresponds to CConfig.RS_WEAPONS_ORDER */
    display_weapons_order?: 'Canon' | 'Location' | 'Heat' | 'Damage' | 'BV'; // Example based on common sorting options

    /** If true, critical slots are automatically filled when equipment is added in the editor. Corresponds to CConfig.MEK_AUTOFILL */
    editor_autofill_criticals?: boolean;
    /** If true, critical slots are automatically sorted in the editor. Corresponds to CConfig.MEK_AUTOSORT */
    editor_autosort_criticals?: boolean;
    /** If true, critical slots are automatically compacted in the editor. Corresponds to CConfig.MEK_AUTOCOMPACT */
    editor_autocompact_criticals?: boolean;

    // .mul file handling
    /** Default action to take when opening a .mul (MegaMek Unit List) file. Corresponds to CConfig.MISC_MUL_OPEN_BEHAVIOUR */
    mul_default_open_action?: 'ViewForce' | 'EditForce'; // Example: 'ViewForce' might open in a read-only summary, 'EditForce' might open in an editable list.
}
