<?php

class SV_IgnoreUserLimit_Installer
{
    public static function install($installedAddon, array $addonData, SimpleXMLElement $xml)
    {
        $version = isset($installedAddon['version_id']) ? $installedAddon['version_id'] : 0;
        if (XenForo_Application::$versionId < 1030070)
        {
            throw new Exception('XenForo 1.3.0+ is Required!');
        }

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
}
