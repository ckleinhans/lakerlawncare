import React from "react";
import Table from "react-bootstrap/Table";

function Invoice(props) {
  const { customerName, transactions, companyVenmo } = props;

  const dateURI = encodeURIComponent(
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    })
  );

  let totalAmount = 0;

  const transactionTable = transactions
    .filter((transaction) => !transaction.complete)
    .map((transaction) => {
      const { date, amount, key } = transaction;
      totalAmount += amount;
      return (
        <tr key={key}>
          <td>
            {new Date(date).toLocaleDateString("en-US", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </td>
          <td> </td>
          <td>${amount.toFixed(2)}</td>
        </tr>
      );
    });

  return (
    <div>
      Hello {customerName.split(" ")[0]},
      <br />
      <br />
      Thank you again for choosing Laker Lawn Care for your lawn service! Please
      see your balance due below and pay as soon as you are able. If you have
      any questions, feel free to reply to this email and we will get back to
      you as soon as possible.
      <br />
      <br />
      <Table size="sm">
        <tbody>
          {transactionTable}
          <tr>
            <td>
              <b>Total Owed:</b>
            </td>
            <td> </td>
            <td>
              <b>${totalAmount.toFixed(2)}</b>
            </td>
          </tr>
        </tbody>
      </Table>
      <br />
      Please Venmo @{companyVenmo} or use this link:
      <br />
      <a
        target="_blank"
        rel="noreferrer"
        href={`https://venmo.com/${companyVenmo}?txn=pay&audience=private&amount=${totalAmount}&note=Laker%20Lawn%20Care%20${dateURI}%20Invoice`}
      >
        https://venmo.com/{companyVenmo}
        ?txn=pay&audience=private&amount=
        {totalAmount}&note=Laker%20Lawn%20Care%20
        {dateURI}%20Invoice
      </a>
      <br />
      <br />
      If you don't have Venmo you can Zelle lakerlawncare612@gmail.com or send a
      check to:
      <br />
      Caelan Kleinhans
      <br />
      1311 W Dayton St, Apt 4<br />
      Madison, WI 53715
      <br />
      <br />
      Thank you!
    </div>
  );
}

export default (Invoice);
