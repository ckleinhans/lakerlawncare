import Modal from "react-bootstrap/esm/Modal";
import Alert from "react-bootstrap/esm/Alert";
import React from "react";

function Popup(props) {
  const { show, isError, message, onClose } = props;
  return (
    <Modal show={!!show} centered onHide={onClose}>
      <Alert
        dismissible
        onClose={onClose}
        style={{ marginBottom: "0px" }}
        variant={isError ? "danger" : "primary"}
      >
        <div style={{ paddingBottom: "15px", paddingTop: "15px" }}>
          {message}
        </div>
      </Alert>
    </Modal>
  );
}

export default Popup;
