<?php

class SV_IgnoreUserLimit_XenForo_ControllerPublic_Account extends XFCP_SV_IgnoreUserLimit_XenForo_ControllerPublic_Account
{
    public function actionIgnored()
    {
        $response = parent::actionIgnored();

        if ($response instanceof XenForo_ControllerResponse_View && $response->subView)
        {
            $raw = $this->_input->filterSingle('r', XenForo_Input::BOOLEAN);
            if ($raw)
            {
                $response = $response->subView;
                $response->params['raw'] = true;
            }
        }

        return $response;
    }
}

// ******************** FOR IDE AUTO COMPLETE ********************
if (false)
{
    class XFCP_SV_IgnoreUserLimit_XenForo_ControllerPublic_Account extends XenForo_ControllerPublic_Account{}
}
