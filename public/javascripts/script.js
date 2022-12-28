const express = require("express")
const { post, response } = require("../../app")

function  addToCart(proId) {
    $.ajax({
        url: '/add-to-cart/' + proId,
        method: 'post',
        success: (response) => {

            if (response.status) {
                let count = $('#cart-count').html()
                count = parseInt(count) + 1
                $('#cart-count').html(count)
            }
            location.reload()

            Swal.fire(


                ' Added !',
                'success',

            )

        }
    })
}



function changeQuantity(cartId, proId, userId, count, quantity) {
    $.ajax({
        url: '/changequantity',

        data: {
            cart: cartId,
            product: proId,
            user: userId,
            count: count,
            quantity: quantity
        },
        method: 'post',
        success: (response) => {
            if (response) {
                let result = document.getElementById(proId).innerHTML
                document.getElementById(proId).innerHTML = parseInt(result) + parseInt(count)
                document.getElementById('total'), innerHTML = response.total
            }
            location.reload()
        }
        
    })
}


function deleteProduct(cartId, proId)
{
    

           $.ajax({
            
               url: '/remove-item',
               data: {
                   cartId: cartId,
                   proId: proId
               },
               method: 'post',
               success: (response) =>
                {
                   if (response) {
                    
                     alert("item deleted")
                       window.location.reload()
                   }
               }
           })
}

function deleteProductq(cartId, proId)
{
    

           $.ajax({
            
               url: '/remove-itemq',
               data: {
                   cartId: cartId,
                   proId: proId
               },
               method: 'post',
               success: (response) =>
                {
                   if (response) {
                    
                     alert("item deleted")
                       window.location.reload()
                   }
               }
           })
}









// function deleteProduct(cartId, proId)
// console.log('=ajax*********');
//          {
//                     $.ajax({

//                         url: '/remove-item',
//                         data: {

//                             cartId: cartId,
//                             proId: proId
//                         },
//                         method: 'post',
//                         success: (response) =>
//                          {
//                             if (response) {
//                                 window.location.reload()
//                             }
//                         }
//                     })
//         }




    //     Swal.fire({
    // title: 'Are you sure?',
    // text: "You won't be able to revert this!",
    // icon: 'warning',
    // showCancelButton: true,
    // confirmButtonColor: '#3085d6',
    // cancelButtonColor: '#d33',
    // confirmButtonText: 'Yes, delete it!'
    // }).then((result) => {
    // if (result.isConfirmed) {
    //     $.ajax({
    //         url:'/remove-item',
    //         data:{
    //             cartId:cartId,
    //             proId:proId
    //         },
    //         method:'post',
    //         success:(response)=>{
    //             if(response){
    //                 window.location.reload()
    //             }
    //         }
    //     })

    // }
    //   else{


    //     }

    // })

