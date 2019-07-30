<?php

class SV_IgnoreUserLimit_XenForo_Model_UserIgnore extends XFCP_SV_IgnoreUserLimit_XenForo_Model_UserIgnore
{
    /**
     * @param int $userId
     * @return int
     */
    public function getIgnoredUserCount($userId)
    {
        $count = $this->_getDb()->fetchOne('
            SELECT count(user_id)
            FROM xf_user_ignored
            WHERE user_id = ?
        ', $userId);

        return $count ? $count : 0;
    }

    public function ignoreUsers($userId, $ignoredUserIds)
    {
        $ignoreLimit = -1;
        $visitor = XenForo_Visitor::getInstance();
        if ($userId == $visitor->getUserId())
        {
            $ignoreLimit = $visitor->hasPermission('general', 'sv_userIgnoreLimit');

            if ($visitor->hasPermission('general', 'sv_userIgnoreDisabled'))
            {
                throw new XenForo_Exception(new XenForo_Phrase('sv_you_may_only_ignore_x_people', ['count' => 0]), true);
            }
        }

        if ($ignoreLimit >= 0)
        {
            $ignoreCount = $this->getIgnoredUserCount($userId) + (is_array($ignoredUserIds) ? count($ignoredUserIds) : 1);
            if ($ignoreCount > $ignoreLimit)
            {
                throw new XenForo_Exception(new XenForo_Phrase('sv_you_may_only_ignore_x_people', ['count' => $ignoreLimit]), true);
            }
        }

        return parent::ignoreUsers($userId, $ignoredUserIds);
    }

    public function canIgnoreUser($userId, array $user, &$error = '')
    {
        $setError = (func_num_args() >= 3);

        $visitor = XenForo_Visitor::getInstance();
        if ($visitor->hasPermission('general', 'sv_userIgnoreDisabled'))
        {
            if ($setError)
            {
                $error = new XenForo_Exception(new XenForo_Phrase('sv_you_may_only_ignore_x_people', ['count' => 0]), true);
            }

            return false;
        }

        if ($setError)
        {
            return parent::canIgnoreUser($userId, $user, $error);
        }
        else
        {
            return parent::canIgnoreUser($userId, $user);
        }
    }
}

// ******************** FOR IDE AUTO COMPLETE ********************
if (false)
{
    class XFCP_SV_IgnoreUserLimit_XenForo_Model_UserIgnore extends XenForo_Model_UserIgnore {}
}
