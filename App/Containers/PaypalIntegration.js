import React, { useState, useEffect } from 'react'
import { View } from 'react-native'
import { WebView } from 'react-native-webview'
import { UIActivityIndicator } from 'react-native-indicators'
import axios from 'axios'
import qs from 'qs'

const PayPalView = () => {
  const [paypalData, setPaypalData] = useState({
    accessToken: null,
    approvalUrl: null,
    paymentId: null,
    token: null
  })

  let currency = '100 USD'
  currency.replace(' USD', '')

  const dataDetail = {
    intent: 'sale',
    payer: {
      payment_method: 'paypal'
    },
    transactions: [
      {
        amount: {
          total: 100,
          currency: 'USD',
          details: {
            subtotal: 100,
            tax: '0',
            shipping: '0',
            handling_fee: '0',
            shipping_discount: '0',
            insurance: '0'
          }
        }
      }
    ],
    redirect_urls: {
      return_url: 'https://example.com',
      cancel_url: 'https://example.com'
    }
  }
  useEffect(() => {
    const url = 'https://api.sandbox.paypal.com/v1/oauth2/token'
    const data = {
      grant_type: 'client_credentials'
    }
    const auth = {
      username:
        'AQBE9hMVAvTF-swaPyFT3saZnYsnp7-gp97xueg84nBucZRRGYt2ka2nNqJBsvE8KBw2FmrH52SX_dYD',
      password:
        'EChOpwZkcypi_tMdCsg9-DiVeV6mtWqSuA5DHp7tuX2FgiZOONsWaKaJRtdL3Juq2jm8AqW9gr2a-Ar4'
    }
    const options = {
      method: 'post',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'Access-Control-Allow-Credentials': true
      },
      data: qs.stringify(data),
      auth,
      url
    }
    axios(options)
      .then(response => {
        const { token_type, access_token } = response.data
        const token = `${token_type} ${access_token}`
        setPaypalData(prevData => {
          return {
            ...prevData,
            token
          }
        })
        fetch('https://api.sandbox.paypal.com/v1/payments/payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token
          },
          body: JSON.stringify(dataDetail)
        })
          .then(response => response.json())
          .then(jsonResponse => {
            const { id: paymentId, links } = jsonResponse
            const approvalUrl = links.find(data => data.rel == 'approval_url')
            setPaypalData({
              approvalUrl,
              paymentId
            })
          })
          .catch(error => {
            console.log(error)
          })
      })
      .catch(error => {
        console.log(error)
      })
  }, [])
  const onNavigationStateChange = webViewState => {
    debugger
    if (webViewState.url.includes('https://example.com/')) {
      console.log(webViewState, 'web')
      setPaypalData(prevData => ({
        ...prevData,
        approvalUrl: null
      }))
      const { PayerID, paymentId } = webViewState.url
      fetch(
        `https://api.sandbox.paypal.com/v1/payments/payment/${paypalData.paymentId}/execute`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: paypalData.token
          },
          body: JSON.stringify({ payer_id: PayerID })
        }
      )
        .then(response => {
          debugger
          console.log(response)
        })
        .catch(error => {
          debugger
          console.log(error)
        })
    }
  }
  return (
    <View style={{ flex: 1 }}>
      {paypalData.approvalUrl ? (
        <WebView
          style={{ flex: 1 }}
          source={{ uri: paypalData.approvalUrl.href }}
          onNavigationStateChange={onNavigationStateChange}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
        />
      ) : (
        <UIActivityIndicator />
      )}
    </View>
  )
}

export default PayPalView
