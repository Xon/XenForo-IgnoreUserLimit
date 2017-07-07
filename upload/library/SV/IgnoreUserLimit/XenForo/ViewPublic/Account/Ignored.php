<?php

class SV_IgnoreUserLimit_XenForo_ViewPublic_Account_Ignored extends XFCP_SV_IgnoreUserLimit_XenForo_ViewPublic_Account_Ignored
{
    public function renderJson()
    {
        if (empty($this->_params['raw']))
        {
            return;
        }

        $threadIds = array();
        $userNames = XenForo_Application::arrayColumn($this->_params['ignored'], 'username');
        return array('ignoredUsers' => $userNames, 'ignoredThreads' => $threadIds);
    }
}

// ******************** FOR IDE AUTO COMPLETE ********************
if (false)
{
    class XFCP_SV_IgnoreUserLimit_XenForo_ViewPublic_Account_Ignored extends XenForo_ViewPublic_Account_Ignored {}
}
