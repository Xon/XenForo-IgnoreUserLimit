<?php

class SV_IgnoreUserLimit_Listener
{
    const AddonNameSpace = 'SV_IgnoreUserLimit';

    public static function install($installedAddon, array $addonData, SimpleXMLElement $xml)
    {
        $version = isset($installedAddon['version_id']) ? $installedAddon['version_id'] : 0;

        $db = XenForo_Application::getDb();

        if ($version == 0)
        {
            // make sure XenForo_Model_User is extended
            XenForo_Model::create("XenForo_Model_User");

            $db->query("insert ignore into xf_permission_entry (user_group_id, user_id, permission_group_id, permission_id, permission_value, permission_value_int)
                select " . XenForo_Model_User::$defaultRegisteredGroupId . ", 0, 'general', 'sv_userIgnoreLimit', 'allow', '-1'
                from xf_permission_entry
            ");
        }
    }

    public static function load_class($class, &$extend)
    {
        $extend[] = self::AddonNameSpace.'_'.$class;
    }

    public static function visitor_setup(XenForo_Visitor &$visitor)
    {
        if ($visitor->hasPermission('general', 'sv_userIgnoreDisabled'))
        {
            $visitor['ignored'] = '';
            $visitor['ignoredUsers'] = array();
        }
    }
}
