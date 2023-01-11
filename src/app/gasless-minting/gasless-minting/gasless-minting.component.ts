import { AfterViewInit, Component, Inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  AngularContract,
  DappInjector,
  no_network,
  angular_web3,
  DappBaseComponent,
  netWorkById,
} from 'angular-web3';
import { Contract, ethers, providers } from 'ethers';
import { GaslessMinting } from 'src/assets/contracts/interfaces/GaslessMinting';

//import {  CallWithSyncFeeRequest,GelatoRelay,SponsoredCallERC2771Request } from '@gelatonetwork/relay-sdk';
import { PaymentService } from 'src/app/shared/services/payment';
import { DOCUMENT } from '@angular/common';

import { GelatoRelay } from 'src/app/realy-sdk';
import { SharedService } from 'src/app/shared/services/postboot.service';
import { firstValueFrom, pipe } from 'rxjs';

import axios from "axios";

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


  constructor(
    store: Store,
    dapp: DappInjector,
    public pmt: PaymentService,
    public shared: SharedService,
    @Inject(DOCUMENT) private readonly document: any
  ) {
    super(dapp, store);
  }

  async getTokenId(){
    this.toKenId = (await this.gaslessMinting._tokenId()).toString()
  }

  async goPaypal(){
    let ethereum = (window as any).ethereum;

    const { data } =
      await this.gaslessMinting.populateTransaction.relayMint()

    const request = {
      chainId: 5, // Goerli in this case
      target: this.gaslessMinting.address, // target contract address
      data: data!, // encoded transaction datas
      user: this.dapp.signerAddress!, //user sending the trasnaction
    };
    const sponsorApiKey = '1NnnocBNgXnG1VgUnFTHXmUICsvYqfjtKsAq1OCmaxk_';

    let signnedRequest = await relay.signDataERC2771(
      request,
      new ethers.providers.Web3Provider(ethereum),
      sponsorApiKey
    );

 

    let paypalResult  = await firstValueFrom(
      this.shared.paymentPaypal(signnedRequest)
    );

  document.location.href = paypalResult;
  }

  async createRequest() {
    let ethereum = (window as any).ethereum;

    const { data } =
      await this.gaslessMinting.populateTransaction.relayMint()

    const request = {
      chainId: 5, // Goerli in this case
      target: this.gaslessMinting.address, // target contract address
      data: data!, // encoded transaction datas
      user: this.dapp.signerAddress!, //user sending the trasnaction
    };
    const sponsorApiKey = '1NnnocBNgXnG1VgUnFTHXmUICsvYqfjtKsAq1OCmaxk_';

    let signnedRequest = await relay.signDataERC2771(
      request,
      new ethers.providers.Web3Provider(ethereum),
      sponsorApiKey
    );


    const RELAY_URL = "https://relay.gelato.digital";
    // let resultA =  (await axios.post(`${RELAY_URL}/relays/v2/sponsored-call-erc2771`, signnedRequest)).data;
    // console.log(resultA);

    //   return
      //"0xeec2c397159b63acced17673f8e48f9c28ea873769eedc99391958cb9d9b9e6a"
    let intentResult = await firstValueFrom(
      this.shared.paymentStripeIntent(signnedRequest)
    );
    let clientSecret = intentResult.clientSecret;
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
      //this.cardState = paymentState.fail;
      console.log(result.error);
      // Display error.message in your UI.
    } else {
    }
  }

  override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.loadScript();
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
    this.getTokenId()

  }
  init() {
    this.stripe = Stripe('pk_test_98apj66XNg5rUu7i0Hzq5W1y00wYq5kIbY');
    console.log(this.stripe);
    // this.paymentRequest = this.stripe.paymentRequest({
    //   country: 'ES',
    //   currency: 'eur',
    //   total: {
    //     label: 'this.payload.title',
    //     amount: 50* 100,
    //   },
    //   requestPayerName: false,
    //   requestPayerEmail: true,
    // });
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
    //this.checkBrowser();
  }

  connect() {
    this.dapp.launchWebModal();
  }
}
