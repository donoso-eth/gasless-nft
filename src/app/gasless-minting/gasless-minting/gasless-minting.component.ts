import { AfterViewInit, Component, Inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  AngularContract,
  DappInjector,
  no_network,
  angular_web3,
  DappBaseComponent,
  netWorkById,
  Web3Actions,
} from 'angular-web3';
import { Contract, ethers, providers } from 'ethers';
import { GaslessMinting } from 'src/assets/contracts/interfaces/GaslessMinting';

//import {  CallWithSyncFeeRequest,GelatoRelay,SponsoredCallERC2771Request } from '@gelatonetwork/relay-sdk';
import { PaymentService } from 'src/app/shared/services/payment';
import { DOCUMENT } from '@angular/common';

import { GelatoRelay } from 'src/app/realy-sdk';
import { SharedService } from 'src/app/shared/services/postboot.service';
import { firstValueFrom, pipe } from 'rxjs';

import GaslessMintingMetadata from 'src/assets/contracts/gasless-minting_metadata.json';

import { ExternalProvider, Web3Provider } from '@ethersproject/providers';

import { IpfsService } from 'src/app/shared/services/ipfs.service';

import { Web3Auth, Web3AuthOptions } from '@web3auth/modal';
import { CHAIN_NAMESPACES, WALLET_ADAPTERS } from '@web3auth/base';
import { OpenloginAdapter } from '@web3auth/openlogin-adapter';
import {
  GaslessOnboarding,
  GaslessWalletConfig,
  GaslessWalletInterface,
  LoginConfig,
} from '@gelatonetwork/gasless-onboarding';

import { GaslessWallet } from '@gelatonetwork/gasless-wallet';

import { Server } from 'http';
import { Router, UrlTree } from '@angular/router';

const relay = new GelatoRelay();
// const openloginAdapter = new OpenloginAdapter(OpenloginAdapterOptions);
declare var Stripe: any;

@Component({
  selector: 'gasless-minting',
  templateUrl: './gasless-minting.component.html',
  styles: [
    `
      .blockchain_is_busy {
        animation: spinHorizontal 2s infinite linear;
        filter: hue-rotate(220deg);
      }
      @keyframes spinHorizontal {
        0% {
          transform: rotate(0deg);
        }
        50% {
          transform: rotate(360deg);
        }
        100% {
          transform: rotate(0deg);
        }
      }
    `,
  ],
})
export class GaslessMintingComponent
  extends DappBaseComponent
  implements AfterViewInit
{
  paymentRequest: any;
  elements: any;
  card: any;
  stripe: any;
  gaslessMinting!: GaslessMinting;
  toKenId!: string;
  show_success = false;
  randGif!: number;
  web3auth!: Web3Auth;
  provider: ethers.providers.Web3Provider | null = null;
  gaslessOnboarding!: GaslessOnboarding;
  gelatoSmartWallet!: GaslessWallet;
  isDeployed!: boolean;
  web3authProvider: any;
  gaslessWalletConfig!: { apiKey: string };
  gelatoWalletAddress!:string;
  eoa!:string;
  user!:string;

  constructor(
    store: Store,
    dapp: DappInjector,
    public pmt: PaymentService,
    public shared: SharedService,
    public ipfsService: IpfsService,
    public router:Router,
    @Inject(DOCUMENT) private readonly document: any
  ) {
    super(dapp, store);
  }

  async getTokenId() {
    this.toKenId = (await this.gaslessMinting._tokenIds()).toString();
  }

  async aaMint() {
    if (this.provider == null) {
      alert('please sign in');
      return;
    }
    this.store.dispatch(Web3Actions.chainBusy({ status: true }));
    this.store.dispatch(
      Web3Actions.chainBusyWithMessage({
        message: { body: `Preparing the transaction`, header: 'Waiting..' },
      })
    );
    this.randGif = 0;

    let imgRandom = Math.floor(1 + 4 * Math.random());

    this.randGif = imgRandom;

    let imgName = `${imgRandom}.gif`;
    const metadata = {
      description: 'Gelato Gasless NFT',
      external_url: 'https://openseacreatures.io/3',
      image: `https://gelato-gasless-nft.web.app/assets/images/${imgName}`,
      name: `#${+this.toKenId + 1} Gelato Gasless NFT`,
      attributes: [
        { value: 'Gasless' },
        { value: 'Fiat Payed' },
        { value: 'With Stripe' },
      ],
    };

    const blob = new Blob([JSON.stringify(metadata)], {
      type: 'application/json',
    });
    const file = new File([blob], 'metadata.json');
    this.store.dispatch(
      Web3Actions.chainBusyWithMessage({
        message: {
          body: `Please wait till IPFS finish the process`,
          header: 'Uploading to IPFS..',
        },
      })
    );
    try {
      let cid = await this.ipfsService.addFile(file);
      let url = `https://ipfs.io/ipfs/${cid}/metadata.json`;

      const { data } = await this.gaslessMinting.populateTransaction.aaMint(
        url
      );

    let tx = await this.gelatoSmartWallet.sponsorTransaction(
      this.gaslessMinting.address,
      data!
    );

    


    } catch(error) {
      this.store.dispatch(Web3Actions.chainBusy({ status: false }));
      alert('Something went wrong sorry');
      console.log(error);
    
    }
  }

  /// Web3auth Connect
  async connect() {
    this.gaslessWalletConfig = {
      apiKey: '1NnnocBNgXnG1VgUnFTHXmUICsvYqfjtKsAq1OCmaxk_',
    };
    const loginConfig: LoginConfig = {
      chain: {
        id: 5, //80001,//5,
        rpcUrl: 'https://goerli.infura.io/v3/460f40a260564ac4a4f4b3fffb032dad', //"https://polygon-mumbai.g.alchemy.com/v2/P2lEQkjFdNjdN0M_mpZKB8r3fAa2M0vT",//
      },
      ui: {
        theme: 'dark',
      },
      openLogin: {
        redirectUrl: `${window.location.origin}/login`,
      },
    };
    this.gaslessOnboarding = new GaslessOnboarding(
      loginConfig,
      this.gaslessWalletConfig
    );

    await this.gaslessOnboarding.init();

    this.web3authProvider = await this.gaslessOnboarding.login();

    this.gelatoSmartWallet = await this.gaslessOnboarding.getGaslessWallet()



    // return

    // const clientId =
    //   'BNmf-E8UopCwqiMkOIhqF8h0kjU-tk-zvsaIwsRlNJQVwtZwWUlhc89WUw9XwnzWCyy4fuvPZRiUXxRcrDZHoL4';
    // this.web3auth = new Web3Auth({
    //   clientId,
    //   web3AuthNetwork: 'testnet',
    //   chainConfig: {
    //     // this is ethereum chain config, change if other chain(Solana, Polygon)
    //     chainNamespace: CHAIN_NAMESPACES.EIP155,
    //     chainId: '0x5',

    //     rpcTarget:
    //       'https://goerli.infura.io/v3/460f40a260564ac4a4f4b3fffb032dad',
    //   },
    //   uiConfig: {
    //     theme: 'dark',
    //     defaultLanguage: 'en',
    //     loginMethodsOrder: ['google'],
    //     //appLogo: 'https://gelato-gasless-nft-web3auth.web.app/assets/images/gelato.svg', // Your App Logo Here
    //   },
    // });
    // await this.web3auth.initModal();
    // const web3authProvider = await this.web3auth.connect();
    // const id_token = await this.web3auth.authenticateUser();
    // console.log(id_token);
    const user = await this.gaslessOnboarding.getUserInfo();

    this.user = user.email!;

    this.provider = new providers.Web3Provider(this.web3authProvider);

    this.eoa= (await this.provider!.listAccounts())[0];

      this.gelatoWalletAddress = this.gelatoSmartWallet.getAddress()!

    this.gaslessMinting = new Contract(
      GaslessMintingMetadata.address,
      GaslessMintingMetadata.abi,
      this.provider!
    ) as GaslessMinting;
    this.gaslessMinting.on('Transfer', async () => {
      await this.getTokenId();
      this.store.dispatch(Web3Actions.chainBusy({ status: false }));
      this.show_success = true;
    });
    await this.getTokenId();
  }

  async getMetadata() {
    if (this.provider == null) {
      alert('please sign in');
      return false;
    }
    this.store.dispatch(Web3Actions.chainBusy({ status: true }));
    this.store.dispatch(
      Web3Actions.chainBusyWithMessage({
        message: { body: `Preparing the transaction`, header: 'Waiting..' },
      })
    );
    this.randGif = 0;

    let imgRandom = Math.floor(1 + 4 * Math.random());

    this.randGif = imgRandom;

    let imgName = `${imgRandom}.gif`;
    const metadata = {
      description: 'Gelato Gasless NFT',
      external_url: 'https://openseacreatures.io/3',
      image: `https://gelato-gasless-nft.web.app/assets/images/${imgName}`,
      name: `#${+this.toKenId + 1} Gelato Gasless NFT`,
      attributes: [
        { value: 'Gasless' },
        { value: 'Fiat Payed' },
        { value: 'With Stripe' },
      ],
    };

    const blob = new Blob([JSON.stringify(metadata)], {
      type: 'application/json',
    });
    const file = new File([blob], 'metadata.json');
    this.store.dispatch(
      Web3Actions.chainBusyWithMessage({
        message: {
          body: `Please wait till IPFS finish the process`,
          header: 'Uploading to IPFS..',
        },
      })
    );
    try {
      let cid = await this.ipfsService.addFile(file);
      let url = `https://ipfs.io/ipfs/${cid}/metadata.json`;

      const { data } = await this.gaslessMinting.populateTransaction.aaMint(
        url
      );

      let object: { web3authProvider:any, gaslessWalletConfig:any, target:any, data:any} = {
        data,
        target: this.gaslessMinting.address,
        gaslessWalletConfig: this.gaslessWalletConfig,
        web3authProvider: this.web3authProvider,
      };
      return object
    } catch (error) {
      this.store.dispatch(Web3Actions.chainBusy({ status: false }));
      alert('Something went wrong sorry');
      console.log(error);
      return false;
    }
  }

  /// IPFS and Signing request
  async getSignedRequest() {
    if (this.provider == null) {
      alert('please sign in');
      return false;
    }

    this.store.dispatch(Web3Actions.chainBusy({ status: true }));
    this.store.dispatch(
      Web3Actions.chainBusyWithMessage({
        message: { body: `Preparing the transaction`, header: 'Waiting..' },
      })
    );
    this.randGif = 0;

    // let ethereum = (window as any).ethereum;

    // const currentChainId = await ethereum.request({
    //   method: 'eth_chainId',
    // });

    // console.log(currentChainId);

    // if (currentChainId !== '0x5') {
    //   await ethereum.request({
    //     method: 'wallet_switchEthereumChain',
    //     params: [{ chainId: '0x5' }],
    //   });
    //   // refresh
    //   window.location.reload();
    // }

    let imgRandom = Math.floor(1 + 4 * Math.random());

    this.randGif = imgRandom;

    let imgName = `${imgRandom}.gif`;
    const metadata = {
      description: 'Gelato Gasless NFT with Fiat',
      external_url: 'https://openseacreatures.io/3',
      image: `https://gelato-gasless-nft.web.app/assets/images/${imgName}`,
      name: `#${+this.toKenId + 1} Gelato Gasless NFT`,
      attributes: [
        { value: 'Gasless' },
        { value: 'Fiat Payed' },
        { value: 'With Stripe' },
      ],
    };

    const blob = new Blob([JSON.stringify(metadata)], {
      type: 'application/json',
    });
    const file = new File([blob], 'metadata.json');
    this.store.dispatch(
      Web3Actions.chainBusyWithMessage({
        message: {
          body: `Please wait till IPFS finish the process`,
          header: 'Uploading to IPFS..',
        },
      })
    );
    try {
      let cid = await this.ipfsService.addFile(file);
      let url = `https://ipfs.io/ipfs/${cid}/metadata.json`;

      const { data } = await this.gaslessMinting.populateTransaction.aaMint(
        url
      );

      const tx = await this.gelatoSmartWallet.populateSponsorTransaction(
        this.gaslessMinting.address,
        data!
      );


      const address = (await this.provider.listAccounts())[0];
      const request = {
        chainId: 5, // Goerli in this case
        target: this.gelatoWalletAddress, // target contract address
        data: tx.data!, // encoded transaction datas
        user: address, //user sending the trasnaction
      };
      const sponsorApiKey = '1NnnocBNgXnG1VgUnFTHXmUICsvYqfjtKsAq1OCmaxk_';
      this.store.dispatch(
        Web3Actions.chainBusyWithMessage({
          message: { body: `Waiting For Signature.`, header: `Please sign` },
        })
      );

      let signnedRequest = await relay.signDataERC2771(
        request,
        this.provider,
        sponsorApiKey
      );
      return signnedRequest;
    } catch (error) {
      this.store.dispatch(Web3Actions.chainBusy({ status: false }));
      alert('Something went wrong sorry');
      console.log(error);
      return false;
    }
  }

  /// Stripe with signed request
  async goStripeAA() {
    let signnedRequest = await this.getMetadata();
    if (signnedRequest == false) {
      return;
    }


    console.log(signnedRequest);
    return;

    let intentResult = await firstValueFrom(
      this.shared.paymentStripeAAIntent(signnedRequest)
    );

      console.log(intentResult)
    let clientSecret = intentResult.clientSecret;

    this.store.dispatch(
      Web3Actions.chainBusyWithMessage({
        message: {
          header: `Waiting for confirmation`,
          body: `Payment and minting process created <br> your NFT will be: <br> <br> <div style="margin:20px">
            <img width=100 height=100 *ngIf="randGif!= 0" style="object-fit: cover;height:100px;width:100px;" src="assets/images/${this.randGif}.gif" />
          </div>`,
        },
      })
    );

    const result = await this.stripe.handleCardPayment(
      clientSecret,
      this.card,
      {
        payment_method_data: {
          billing_details: { name: 'name lastname' },
        },
      }
    );

    if (result.error) {
      this.store.dispatch(Web3Actions.chainBusy({ status: false }));
      alert('Something went wrong sorr');
      console.log(result.error);
    }
  }

  /// Stripe with signed request
  async goStripe() {
    let signnedRequest = await this.getSignedRequest();
    if (signnedRequest == false) {
      return;
    }

    let intentResult = await firstValueFrom(
      this.shared.paymentStripeIntent(signnedRequest)
    );
    let clientSecret = intentResult.clientSecret;

    this.store.dispatch(
      Web3Actions.chainBusyWithMessage({
        message: {
          header: `Waiting for confirmation`,
          body: `Payment and minting process created <br> your NFT will be: <br> <br> <div style="margin:20px">
          <img width=100 height=100 *ngIf="randGif!= 0" style="object-fit: cover;height:100px;width:100px;" src="assets/images/${this.randGif}.gif" />
        </div>`,
        },
      })
    );

    const result = await this.stripe.handleCardPayment(
      clientSecret,
      this.card,
      {
        payment_method_data: {
          billing_details: { name: 'name lastname' },
        },
      }
    );

    if (result.error) {
      this.store.dispatch(Web3Actions.chainBusy({ status: false }));
      alert('Something went wrong sorr');
      console.log(result.error);
    }
  }

  private loadScript() {
    // this.stripeLoaded = false;
    const script = this.document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.crossorigin = true;
    script.src = 'https://js.stripe.com/v3/';
    script.onload = () => {
      this.init();
    };

    this.document.body.appendChild(script);
  }
  override async hookContractConnected(): Promise<void> {
    let signer = this.dapp.signer!;
  }

 async reconnect() {
  this.store.dispatch(Web3Actions.chainBusy({ status: true }));
  await this.connect();
  this.store.dispatch(Web3Actions.chainBusy({ status: false }));

 }

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();

     let url = window.location.origin;

    if (this.router.url.indexOf('/login')!=-1){
      console.log('connecting...')
      this.reconnect();
          }

    this.loadScript();
  }

  close() {
    this.show_success = false;
    this.randGif = 0;
  }

  init() {
    this.stripe = Stripe('pk_test_98apj66XNg5rUu7i0Hzq5W1y00wYq5kIbY');

    this.elements = this.stripe.elements();

    var style = {
      base: {
        color: '#32325d',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4',
        },
        ':-webkit-autofill': {
          color: '#32325d',
        },
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a',
        ':-webkit-autofill': {
          color: '#fa755a',
        },
      },
    };

    // Create an instance of the card Element.
    this.card = this.elements.create('card', { style: style });
    this.card.mount('#card-element');
    this.store.dispatch(Web3Actions.chainBusy({ status: false }));
  }

  async signOut() {
    await this.web3auth.logout();
    this.provider = null;
  }
}
