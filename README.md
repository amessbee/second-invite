# Agoric Dapp: Dapp-Ed-Cert

Dapp-Ed-Cert is a simple Dapp for the [Agoric smart contract platform](https://docs.agoric.com/) that permits users to add educational certificates to the Agoric blockchain. This Dapp is designed for educational institutions, certification authorities, and students who need a secure and verifiable way to store and share educational credentials. 

Users are given a simple form in which to enter student's personal information and certification details. This data is then sent to the contract to be added to the Agoric VStorage, ensuring that the information is tamper-proof and easily accessible. By leveraging the Agoric blockchain, Dapp-Ed-Cert provides a transparent and reliable method for managing educational certificates, reducing the risk of fraud and simplifying the verification process for employers and other institutions.

_Note that this is a example dapp exploring capabilities of Agoric VStorage with no consideration made for privacy of information. All entered data maybe publicly visible._

This is the user interface of dapp:

<p align="center">
    <img src="ui/public/ui-dapp.png" alt="Edu Cert Dapp" width="700">
</p>

This is how the data looks like in VStorage:

<p align="center">
    <img src="/ui/public//ui-vstorage.png" alt="Edu Cert Dapp" width="500">
</p>

## Getting started

- Follow the instructions at [`agoric-sdk/multichain-testing/README.md`](https://github.com/Agoric/agoric-sdk/tree/master/multichain-testing) to setup the environment. 
- Once up and running, you can deploy the dapp with `make deploy` inside the `contract` directory.
- You can then run the dapp with `yarn start:ui` inside the root directory to launch the user interface.