$( document ).ready(function(){
	var optionCount = $('#inputOptions');
	var fieldHtml = '<div class="input-group"><input type="text" name="options" placeholder="option" class="form-control"><span class="input-group-btn"><a class="btn btn-primary removeButton">-</a></span></div>';
	var inputCounts = 1;

	$('.addButton').on('click',function(){
		$('#inputOptions').append(fieldHtml);
		optionCount++;
	});

	$(optionCount).on('click', '.removeButton', function(e){ 
		e.preventDefault();
		$(this).closest('div').remove();
		optionCount--; 
	});

	var password = document.getElementById("newPassword")
	var confirm_password = document.getElementById("newPasswordConfirm");

	function validatePassword(){
	  if(password.value != confirm_password.value) {
	    confirm_password.setCustomValidity("Passwords Don't Match");
	  } else {
	    confirm_password.setCustomValidity('');
	  }
	}

	password.onchange = validatePassword;
	confirm_password.onkeyup = validatePassword;
});