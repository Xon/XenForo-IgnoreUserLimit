<?php

class SV_IgnoreUserLimit_Listener
{
    public static function load_class($class, &$extend)
    {
        $extend[] = 'SV_IgnoreUserLimit_' . $class;
    }

    public static function visitor_setup(XenForo_Visitor &$visitor)
    {
        if ($visitor->hasPermission('general', 'sv_userIgnoreDisabled'))
        {
            $visitor['ignored'] = '';
            $visitor['ignoredUsers'] = [];
        }
    }
}
