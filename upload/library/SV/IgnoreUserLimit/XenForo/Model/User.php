<?php

class SV_IgnoreUserLimit_XenForo_Model_User extends XFCP_SV_IgnoreUserLimit_XenForo_Model_User
{
    public function isUserIgnored(array $user, $ignoredUser)
    {
        if (isset($user['permissions']))
        {
            if (XenForo_Permission::hasPermission($user['permissions'], 'general', 'sv_userIgnoreDisabled'))
            {
                return false;
            }
        }
        else 
        {
            $visitor = XenForo_Visitor::getInstance();
            if ($user['user_id'] == $visitor['user_id'] && $visitor->hasPermission('general', 'sv_userIgnoreDisabled'))
            {
                return false;
            }
        }

        return parent::isUserIgnored($user, $ignoredUser);
    }
}

// ******************** FOR IDE AUTO COMPLETE ********************
if (false)
{
    class XFCP_SV_IgnoreUserLimit_XenForo_Model_User extends XenForo_Model_User {}
}
