import axios from "axios";
import {
    DEBUG_API_CALLS, REACT_APP_IS_ACTIVE_SK_ENDPOINT, REACT_APP_RAFFLE_AUTH, REACT_APP_SERVICA_API_ENDPOINT, REACT_APP_SK_API_ENDPOINT
} from "config/constants";

const endPointAPISK = `${REACT_APP_SK_API_ENDPOINT}api-raffles/`;
const endPointAPIServica = `${REACT_APP_SERVICA_API_ENDPOINT}kitties-raffles`;
let endPointAPI = REACT_APP_IS_ACTIVE_SK_ENDPOINT ? endPointAPISK : endPointAPIServica;
export const callRafflesAPI = async (method: string, value: any = "", forceSKEndpoint = false) =>
{
    try
    {
        if (window.location.hostname == "localhost" && DEBUG_API_CALLS)
        {
            const methodStr = `Method: ${method}`;
            //const valueStr = value ? `Value: ${JSON.stringify(value, null, 2)}` : "";
            const valueStr = value;
            console.log(`%cCalling API: ${endPointAPI} ${methodStr} ${valueStr}`, "color:blue");
        }

        endPointAPI = forceSKEndpoint ? endPointAPISK : endPointAPI;

        const res = (
            await axios.post(endPointAPI, {
                method: method,
                value: value
            }, {
                headers: {Authorization: REACT_APP_RAFFLE_AUTH},
            })).data;

            // if (window.location.hostname == "localhost" && DEBUG_API_CALLS)
            // {
            //     console.log(`API result for ${method}:`, res.data);
            // }

        return res;
    }
    catch (error)
    {
        console.log("Error:", error);
    }
};
