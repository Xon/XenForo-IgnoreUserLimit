<?php

class SV_IgnoreUserLimit_XenForo_Model_User extends XFCP_SV_IgnoreUserLimit_XenForo_Model_User
{
    public function isUserIgnored(array $user, $ignoredUser)
    {
        if (XenForo_Permission::hasPermission($user['permissions'], 'general', 'sv_userIgnoreDisabled'))
        {
            return false;
        }
        return parent::isUserIgnored($user, $ignoredUser);
    }
}