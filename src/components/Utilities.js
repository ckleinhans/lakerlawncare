module.exportsexports.getTransactions = (finances, customers, users, type, uid) => {
  const transactions = [];
  if (finances) {
    if (type !== "Staff" && finances.customers) {
      Object.keys(finances.customers)
        .filter((id) => !uid || uid === id)
        .forEach((id) => {
          if (finances.customers[id].transactions)
            transactions.push(
              ...Object.keys(finances.customers[id].transactions)
                .filter(
                  (key) =>
                    (type === "Customers" && uid) ||
                    finances.customers[id].transactions[key].amount > 0
                )
                .map((key) => {
                  return {
                    ...finances.customers[id].transactions[key],
                    key: key,
                    payer: customers[id].name,
                    payerType: "Customer",
                  };
                })
            );
        });
    }
    if (type !== "Customers" && finances.staff) {
      Object.keys(finances.staff)
        .filter((id) => !uid || uid === id)
        .forEach((id) => {
          if (finances.staff[id].transactions)
            transactions.push(
              ...Object.keys(finances.staff[id].transactions)
                .filter(
                  (key) =>
                    (type === "Staff" && uid) ||
                    finances.staff[id].transactions[key].amount > 0
                )
                .map((key) => {
                  const amount =
                    type === "All Transactions"
                      ? finances.staff[id].transactions[key].amount * -1
                      : finances.staff[id].transactions[key].amount;
                  return {
                    ...finances.staff[id].transactions[key],
                    key: key,
                    amount,
                    payer: users[id].displayName,
                    payerType: "Staff",
                  };
                })
            );
        });
    }
    if (
      type === "All Transactions" &&
      finances.company &&
      finances.company.transactions
    ) {
      transactions.push(
        ...Object.keys(finances.company.transactions).map((key) => {
          return {
            ...finances.company.transactions[key],
            key: key,
            payer: "COMPANY",
            payerType: "Company",
          };
        })
      );
    }
  }

  return transactions.sort((transaction1, transaction2) => {
    if (transaction2.date === transaction1.date) {
      return transaction2.payerType.localeCompare(transaction1.payerType);
    } else return new Date(transaction1.date) - new Date(transaction2.date);
  });
};

module.exports.getDateString = (date, numeric, time) => {
  if (time)
    if (numeric)
      new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    else
      return new Date(date).toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
  else if (numeric)
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  else
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
};
