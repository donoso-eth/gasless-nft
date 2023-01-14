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

import { getType } from 'mime';

import axios from 'axios';
import { randomString } from 'src/app/shared/helpers/helpers';
import { IpfsService } from 'src/app/shared/services/ipfs.service';
import { threadId } from 'worker_threads';

const relay = new GelatoRelay();

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

  constructor(
    store: Store,
    dapp: DappInjector,
    public pmt: PaymentService,
    public shared: SharedService,
    public ipfsService: IpfsService,
    @Inject(DOCUMENT) private readonly document: any
  ) {
    super(dapp, store);
  }

  async getTokenId() {
    this.toKenId = (await this.gaslessMinting._tokenIds()).toString();
  }

  async getSignedRequest() {
    if (this.blockchain_status !== 'wallet-connected') {
      alert('please connect your wallet');
      return;
    }

    this.store.dispatch(Web3Actions.chainBusy({ status: true }));
    this.store.dispatch(
      Web3Actions.chainBusyWithMessage({
        message: { body: `Preparing the transaction`, header: 'Waiting..' },
      })
    );
    this.randGif = 0;

    let ethereum = (window as any).ethereum;

    const currentChainId = await ethereum.request({
      method: 'eth_chainId',
    });

    console.log(currentChainId);

    if (currentChainId !== '0x5') {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x5' }],
      });
      // refresh
      window.location.reload();
    }

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

      const { data } = await this.gaslessMinting.populateTransaction.relayMint(
        url
      );

      const request = {
        chainId: 5, // Goerli in this case
        target: this.gaslessMinting.address, // target contract address
        data: data!, // encoded transaction datas
        user: this.dapp.signerAddress!, //user sending the trasnaction
      };
      const sponsorApiKey = '1NnnocBNgXnG1VgUnFTHXmUICsvYqfjtKsAq1OCmaxk_';
      this.store.dispatch(
        Web3Actions.chainBusyWithMessage({
          message: { body: `Waitig For Signature.`, header: `Please sign` },
        })
      );

      let signnedRequest = await relay.signDataERC2771(
        request,
        new ethers.providers.Web3Provider(ethereum),
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

  async goStripe() {
    let signnedRequest = await this.getSignedRequest();
    if (signnedRequest==false){
      return
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

  async goPaypal() {
    let signnedRequest = await this.getSignedRequest();
    this.store.dispatch(
      Web3Actions.chainBusyWithMessage({
        message: {
          body: `Waiting for Confirmation`,
          header: `Payment and minting process created <br> your NFT will be:  <div style="margin:20px">
          <img *ngIf="randGif!= 0" style="object-fit: cover;height:100px;width:100px;" src="assets/images/${this.randGif}.gif" />
        </div>`,
        },
      })
    );

    let paypalResult = await firstValueFrom(
      this.shared.paymentPaypal(signnedRequest)
    );

    document.location.href = paypalResult;
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

    this.gaslessMinting = this.dapp.defaultContract!.instance;
    this.gaslessMinting.on('Transfer', () => {
      this.getTokenId();
      this.store.dispatch(Web3Actions.chainBusy({ status: false }));
      this.show_success = true;
    });
    this.getTokenId();
  }

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();

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
  }

  connect() {
    this.dapp.launchWebModal();
  }
}
