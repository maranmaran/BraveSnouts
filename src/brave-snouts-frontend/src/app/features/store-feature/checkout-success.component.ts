import { Component } from '@angular/core';

@Component({
    selector: 'app-checkout-success',
    styles: [
        `
            .animation-ctn {
                text-align: center;
                margin-top: 5em;
            }

            @-webkit-keyframes checkmark {
                0% {
                    stroke-dashoffset: 100px;
                }

                100% {
                    stroke-dashoffset: 200px;
                }
            }

            @-ms-keyframes checkmark {
                0% {
                    stroke-dashoffset: 100px;
                }

                100% {
                    stroke-dashoffset: 200px;
                }
            }

            @keyframes checkmark {
                0% {
                    stroke-dashoffset: 100px;
                }

                100% {
                    stroke-dashoffset: 0px;
                }
            }

            @-webkit-keyframes checkmark-circle {
                0% {
                    stroke-dashoffset: 480px;
                }

                100% {
                    stroke-dashoffset: 960px;
                }
            }

            @-ms-keyframes checkmark-circle {
                0% {
                    stroke-dashoffset: 240px;
                }

                100% {
                    stroke-dashoffset: 480px;
                }
            }

            @keyframes checkmark-circle {
                0% {
                    stroke-dashoffset: 480px;
                }

                100% {
                    stroke-dashoffset: 960px;
                }
            }

            @keyframes colored-circle {
                0% {
                    opacity: 0;
                }

                100% {
                    opacity: 100;
                }
            }

            .icon--order-success svg polyline {
                -webkit-animation: checkmark 0.65s ease-in-out 1.1s backwards;
                animation: checkmark 0.65s ease-in-out 1.1s backwards;
            }

            .icon--order-success svg circle {
                -webkit-animation: checkmark-circle 1s ease-in-out backwards;
                animation: checkmark-circle 1s ease-in-out backwards;
            }

            .icon--order-success svg circle#colored {
                -webkit-animation: colored-circle 1s ease-in-out 1.1s backwards;
                animation: colored-circle 1s ease-in-out 1.1s backwards;
            }

            .animation-ctn {
                text-align: center;
                margin-top: 5em;
            }

            @-webkit-keyframes checkmark {
                0% {
                    stroke-dashoffset: 100px;
                }

                100% {
                    stroke-dashoffset: 200px;
                }
            }

            @-ms-keyframes checkmark {
                0% {
                    stroke-dashoffset: 100px;
                }

                100% {
                    stroke-dashoffset: 200px;
                }
            }

            @keyframes checkmark {
                0% {
                    stroke-dashoffset: 100px;
                }

                100% {
                    stroke-dashoffset: 0px;
                }
            }

            @-webkit-keyframes checkmark-circle {
                0% {
                    stroke-dashoffset: 480px;
                }

                100% {
                    stroke-dashoffset: 960px;
                }
            }

            @-ms-keyframes checkmark-circle {
                0% {
                    stroke-dashoffset: 240px;
                }

                100% {
                    stroke-dashoffset: 480px;
                }
            }

            @keyframes checkmark-circle {
                0% {
                    stroke-dashoffset: 480px;
                }

                100% {
                    stroke-dashoffset: 960px;
                }
            }

            @keyframes colored-circle {
                0% {
                    opacity: 0;
                }

                100% {
                    opacity: 100;
                }
            }

            .icon--order-success svg polyline {
                -webkit-animation: checkmark 0.65s ease-in-out 1.1s backwards;
                animation: checkmark 0.65s ease-in-out 1.1s backwards;
            }

            .icon--order-success svg circle {
                -webkit-animation: checkmark-circle 1s ease-in-out backwards;
                animation: checkmark-circle 1s ease-in-out backwards;
            }

            .icon--order-success svg circle#colored {
                -webkit-animation: colored-circle 1s ease-in-out 1.1s backwards;
                animation: colored-circle 1s ease-in-out 1.1s backwards;
            }
        `,
    ],
    template: `
        <div class="container flex flex-col gap-4 justify-start items-center">
            <div class="animation-ctn">
                <div class="icon icon--order-success svg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="154px" height="154px">
                        <g fill="none" stroke="#22AE73" stroke-width="2">
                            <circle
                                cx="77"
                                cy="77"
                                r="72"
                                style="stroke-dasharray: 480px, 480px; stroke-dashoffset: 960px"
                            ></circle>
                            <circle
                                id="colored"
                                fill="#22AE73"
                                cx="77"
                                cy="77"
                                r="72"
                                style="stroke-dasharray: 480px, 480px; stroke-dashoffset: 960px"
                            ></circle>
                            <polyline
                                class="st0"
                                stroke="#fff"
                                stroke-width="10"
                                points="43.5,77.8 63.7,97.9 112.2,49.4 "
                                style="stroke-dasharray: 100px, 100px; stroke-dashoffset: 200px"
                            />
                        </g>
                    </svg>
                </div>
            </div>

            <h1>Hvala na kupnji!</h1>
            <h3>Račun stižu uskoro na email adresu.</h3>
        </div>
    `,
})
export class CheckoutSuccessComponent { }
