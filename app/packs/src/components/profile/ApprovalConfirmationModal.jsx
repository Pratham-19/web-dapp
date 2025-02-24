import React, { useCallback, useEffect, useState, useMemo } from "react";
import Modal from "react-bootstrap/Modal";
import { patch } from "src/utils/requests";
import { OnChain } from "src/onchain";
import { getAllChainOptions } from "src/onchain/utils";

import { H5, P2 } from "src/components/design_system/typography";
import { toast } from "react-toastify";
import { ToastBody } from "src/components/design_system/toasts";
import { Spinner } from "src/components/icons";
import Checkbox from "src/components/design_system/checkbox";
import Divider from "src/components/design_system/other/Divider";
import Button from "src/components/design_system/button";
import { useWindowDimensionsHook } from "src/utils/window";

const ApprovalConfirmationModal = ({ show, hide, talent, setProfile, railsContext }) => {
  const { mobile } = useWindowDimensionsHook();
  const [chainAPI, setChainAPI] = useState(null);
  const [loading, setLoading] = useState(false);
  const [firstLoading, setFirstLoading] = useState(true);
  const [isWhitelisted, setIsWhitelisted] = useState({});

  const user = talent;

  const approveUser = async () => {
    const params = {
      user: {
        id: user?.id,
        profile_type: "approved"
      }
    };

    const response = await patch(`/api/v1/talent/${user?.id}`, params).catch(() => {
      return false;
    });

    if (response && !response.error) {
      setProfile(prev => ({
        ...prev,
        user: { ...prev.user, profileType: "approved" }
      }));

      toast.success(<ToastBody heading="Success!" body={"User approved successfully."} />, { autoClose: 1500 });

      hide();
      return true;
    }
  };

  const whitelistAddress = async chainId => {
    const currentChainId = await chainAPI.getChainID();

    if (currentChainId !== chainId) {
      await chainAPI.switchChain(chainId);
    } else {
      setLoading(true);
      const isWhitelisted = await chainAPI.whitelistAddress(user?.wallet_address);
      setLoading(false);
      setIsWhitelisted(prev => ({ ...prev, [chainId]: isWhitelisted }));
    }
  };

  const isApproveDisabled = useMemo(() => {
    let disable = false;
    Object.keys(isWhitelisted).forEach(key => {
      const value = isWhitelisted[key];
      if (!value) {
        disable = true;
      }
    });

    return disable;
  }, [isWhitelisted]);

  const setupChain = useCallback(async errorCallback => {
    try {
      const newOnChain = new OnChain(railsContext.contractsEnv);
      await newOnChain.retrieveAccount();
      const correctChain = await newOnChain.recognizedChain();

      if (!correctChain) {
        toast.error(<ToastBody heading="Wrong Network" body={"Change your network to Polygon."} />, {
          autoClose: 1500
        });
        setFirstLoading(false);
        hide();
        return;
      }
      for await (const option of getAllChainOptions(railsContext.contractsEnv)) {
        if (option.name == "Polygon") {
          const isWhitelisted = await newOnChain.isAddressWhitelisted(user?.wallet_address, option.id);
          setIsWhitelisted(prev => ({ ...prev, [option.id]: isWhitelisted }));
        }
      }

      if (newOnChain) {
        setChainAPI(newOnChain);
      }

      setFirstLoading(false);
    } catch (e) {
      console.log(e);
      errorCallback();
    }
  });

  useEffect(() => {
    if (show) {
      let maxTries = 5;
      const errorCallback = () => {
        setTimeout(() => {
          if (!!maxTries) {
            setupChain(errorCallback);
            maxTries--;
          }
          return;
        }, 500);
      };
      setupChain(errorCallback);
    }
  }, [show]);

  if (firstLoading) {
    return (
      <Modal
        scrollable={true}
        show={show}
        onHide={hide}
        centered
        dialogClassName={mobile ? "mw-100 mh-100 m-0" : "remove-background"}
        contentClassName={
          mobile
            ? "h-100 d-flex flex-row justify-content-center align-items-center"
            : "py-7 d-flex flex-row justify-content-center"
        }
        fullscreen="true"
      >
        <Spinner />
      </Modal>
    );
  }

  return (
    <Modal
      scrollable={true}
      show={show}
      onHide={hide}
      centered
      dialogClassName={mobile ? "mw-100 mh-100 m-0" : "remove-background"}
      contentClassName={mobile ? "h-100" : ""}
      fullscreen="true"
      className="edit-modal"
    >
      <Modal.Header closeButton className="px-5">
        <H5 bold text="Confirm approval" />
      </Modal.Header>
      <Divider />
      <Modal.Body>
        {loading && (
          <div className="w-100 my-2 d-flex flex-row justify-content-center">
            <Spinner />
          </div>
        )}
        <P2 text={`Are you sure you want to approve ${user?.name || user?.username}?`} />
        <P2
          className="mt-2"
          text="Before you do, you'll need to whitelist this user's address in both chains before approving them:"
        />
        <div className="mt-2">
          {getAllChainOptions(railsContext.contractsEnv).map(option => (
            <div className="d-flex align-items-center mb-2" key={option.id}>
              {option.name == "Polygon" && (
                <Checkbox
                  className="form-check-input mt-4"
                  checked={isWhitelisted[option.id]}
                  disabled={isWhitelisted[option.id] || loading}
                  onChange={() => whitelistAddress(option.id)}
                >
                  <div className="d-flex flex-wrap">
                    <P2 className="ml-1" text={option.name} />
                  </div>
                </Checkbox>
              )}
            </div>
          ))}
        </div>
      </Modal.Body>
      <Modal.Footer className="px-6 py-3" style={{ borderTop: "none" }}>
        <Button className="mr-2" type="white-ghost" text="Cancel" onClick={hide} />
        <Button type="primary-default" text="Approve" onClick={approveUser} disabled={isApproveDisabled} />
      </Modal.Footer>
    </Modal>
  );
};

export default ApprovalConfirmationModal;
