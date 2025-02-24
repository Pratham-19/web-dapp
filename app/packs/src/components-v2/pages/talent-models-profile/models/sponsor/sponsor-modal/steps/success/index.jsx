import { Button, Icon, Typography } from "@talentprotocol/design-system";
import React from "react";
import { Container, InfoContainer } from "./styled";

export const SuccessStep = ({ closeModal, profile }) => {
  return (
    <Container>
      <Icon name="success" />
      <InfoContainer>
        <Typography specs={{ variant: "h5", type: "bold" }} color="primary01">
          Transaction submitted
        </Typography>
        <Typography specs={{ variant: "p2", type: "regular" }} color="primary03">
          Congratulations! You're officially a {profile.name} Sponsor!
        </Typography>
      </InfoContainer>
      <InfoContainer>
        <Button
          hierarchy="primary"
          size="medium"
          onClick={() => (window.location.href = `/messages?user=${profile.username}`)}
          text="Send Message"
        />
        <Button hierarchy="secondary" size="medium" onClick={closeModal} text="Return" />
      </InfoContainer>
    </Container>
  );
};
