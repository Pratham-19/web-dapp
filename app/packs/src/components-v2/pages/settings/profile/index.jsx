import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import Uppy from "@uppy/core";
import { FileInput } from "@uppy/react";
import AwsS3Multipart from "@uppy/aws-s3-multipart";
import { useEditProfileStore } from "src/contexts/state";
import { Container, AvatarRow, UploadContainer, UploadButtons, InfoRow } from "./styled";
import { Avatar, Button, Input, TextArea, Typography } from "@talentprotocol/design-system";
import { editProfileService } from "src/api/edit-profile";
import { ToastBody } from "src/components/design_system/toasts";
import { getAuthToken } from "src/api/utils";

export const ProfileForm = ({ setIsDirty }) => {
  const profileFileInput = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bioChars, setBioChars] = useState(0);
  useEffect(() => {
    setIsLoading(false);
  }, [setIsLoading]);
  const { profile, updateProfileState } = useEditProfileStore();
  const [profilePic, setProfilePic] = useState({ url: profile?.profile_picture_url });

  useEffect(() => {
    if (!profile) return;
    setProfilePic({ url: profile.profile_picture_url });
    setBioChars(profile?.headline?.length);
  }, [profile]);

  const updateProfile = useCallback(() => {
    const payloadObject = {
      user: {
        display_name: refs.name.current.value
      },
      talent: {
        profile: {
          location: refs.location.current.value,
          headline: refs.headline.current.value,
          profile_picture_url: profilePic
        }
      }
    };
    if (profilePic.file) {
      payloadObject.talent["profile_picture_data"] = profilePic.file;
      payloadObject["profile_picture_url"] = profilePic.url;
    }
    editProfileService
      .editProfile(profile.username, payloadObject)
      .then(() => {
        updateProfileState({
          name: refs.name.current.value,
          user: {
            ...profile.user,
            name: refs.name.current.value,
            display_name: refs.name.current.value
          },
          profile: {
            ...profile.profile,
            location: refs.location.current.value,
            headline: refs.headline.current.value
          },
          headline: refs.headline.current.value,
          profile_picture_url: profilePic.url
        });
        toast.success(<ToastBody heading="Success!" body="Account updated successfully." />, { autoClose: 1500 });
        setIsDirty(false);
      })
      .catch(err => {
        console.error(err);
        toast.error(<ToastBody heading="Error" body={"Something happened while updating your profile"} />);
      });
  }, [profile, profilePic]);

  const refs = {
    name: useRef(),
    location: useRef(),
    headline: useRef()
  };

  const uppyProfile = new Uppy({
    meta: { type: "avatar" },
    restrictions: {
      maxFileSize: 1048576,
      allowedFileTypes: [".jpg", ".png", ".jpeg"]
    },
    autoProceed: true
  });

  uppyProfile.use(AwsS3Multipart, {
    limit: 4,
    companionUrl: "/",
    companionHeaders: {
      "X-CSRF-Token": getAuthToken()
    }
  });

  useEffect(() => {
    if (!profileFileInput.current) return;
    profileFileInput?.current.addEventListener("change", event => {
      const files = Array.from(event.target.files);
      files.forEach(file => {
        try {
          uppyProfile.addFile({
            source: "file input",
            name: file.name,
            type: file.type,
            data: file
          });
        } catch (err) {
          if (err.isRestriction) {
            console.error("Restriction error:", err);
            toast.error(<ToastBody heading="Error" body={"There is a file type restriction."} />);
          } else {
            console.error(err);
            toast.error(<ToastBody heading="Error" body={"Something happened while uploading your avatar picture."} />);
          }
        }
      });
    });
  }, [profileFileInput]);

  useEffect(() => {
    uppyProfile.on("restriction-failed", (file, error) => {
      toast.error(<ToastBody heading="Error" body={error.message} />);
      uppyProfile.reset();
    });
    uppyProfile.on("upload-success", (file, response) => {
      setProfilePic({
        file: {
          // eslint-disable-next-line  no-useless-escape
          id: response.uploadURL.match(/\/cache\/([^\?]+)/)[1], // extract key without prefix
          new_upload: true,
          storage: "cache",
          metadata: {
            size: file.size,
            filename: file.name,
            mime_type: file.type
          }
        },
        url: response.uploadURL
      });
      setIsDirty(true);
    });
    uppyProfile.on("upload", () => {});
  }, [uppyProfile]);

  const changeBio = event => {
    const value = event.target.value;
    setBioChars(value.length);
    setIsDirty(true);
  };

  return (
    <Container>
      <AvatarRow>
        <Avatar size="xl" url={profilePic.url} />
        <UploadContainer>
          <Typography specs={{ type: "light", variant: "p3" }} color="primary04">
            JPG or PNG. Max 1MB
          </Typography>
          <UploadButtons>
            <FileInput
              uppy={uppyProfile}
              inputName="profiles[]"
              locale={{
                strings: {
                  chooseFiles: "Upload Profile Picture"
                }
              }}
            />
          </UploadButtons>
        </UploadContainer>
      </AvatarRow>
      <InfoRow>
        <Input
          label="Display Name"
          shortDescription="The name that we will generally use"
          placeholder="Pedro Pereira"
          defaultValue={profile?.user.name}
          inputRef={refs.name}
          onChange={() => setIsDirty(true)}
        />
        <Input
          inputRef={refs.location}
          label="Current Location"
          placeholder="City, Location"
          defaultValue={profile?.profile.location}
          onChange={() => setIsDirty(true)}
        />
      </InfoRow>
      <TextArea
        label="Short Bio"
        caption={`${bioChars}/70 chars max`}
        placeholder="This is the first thing people read about you after your name. Make it count 💫"
        defaultValue={profile?.profile.headline}
        textAreaRef={refs.headline}
        hasError={bioChars > 70}
        onChange={event => changeBio(event)}
      />
      {!isLoading &&
        createPortal(
          <Button hierarchy="primary" size="small" text="Save" onClick={updateProfile} isDisabled={bioChars > 70} />,
          document.getElementById("save-button")
        )}
    </Container>
  );
};
