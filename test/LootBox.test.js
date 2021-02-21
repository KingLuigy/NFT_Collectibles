const { expectRevert, time } = require("@openzeppelin/test-helpers");
const LootBox = artifacts.require("LootBox");
const KingERC1155 = artifacts.require("KingERC1155");
const ClaimBounty = artifacts.require("ClaimBounty");
const MockERC20 = artifacts.require("MockERC20");

contract("LootBox", (accounts) => {
    const e18 = "000000000000000000";
  
    beforeEach(async () => {
      this.mockERC20 = await MockERC20.new(
        "mock",
        "test",
        "10000000000000000000000000000",
        { from: accounts[0] }
      );
      this.kingERC1155 = await KingERC1155.new(
        { from: accounts[0] }
      );

      this.lootbox = await LootBox.new(
        accounts[0],
        this.kingERC1155.address,
        this.mockERC20.address,
        { from: accounts[0] }
      );

      var i;
      var bal = [];
      var prob = [];
      var id = [];
      var count = 0;
      for (i = 0; i <= 60; i++) {
        id[i] = i;
        if(i == 1){
          bal[i] = 255;
        }else if (i%3 == 0){
          bal[i] = 255;
        } else {
          bal[i] = 255;
        }
        if(i == 0 ){
          prob[i] = 0;
        }
        if(count == 1){
          prob[i] = 9200;
        }
        if(count == 2){
          prob[i] = 770;
        } 
        if(count == 3){
          prob[i] = 30;
          count = 0;
        }  
        count++;
        console.log("ID :" + i + "prob :" + prob[i]);  
      }


      await this.lootbox.setNFTProbability(id,prob);
      await this.lootbox.setSeed(25182831283);

      this.claimBounty = await ClaimBounty.new(
        this.kingERC1155.address,
        accounts[0],
        this.mockERC20.address,
        { from: accounts[0] }
      );

      await this.kingERC1155.setMinter(this.lootbox.address, true);
      await this.kingERC1155.setMinter(accounts[0], true);
      await this.kingERC1155.setMinter(this.claimBounty.address, true);


      await this.mockERC20.approve(this.lootbox.address, "100000" + e18, {
        from: accounts[0],
      });
      await this.mockERC20.approve(this.claimBounty.address, "100000" + e18, {
        from: accounts[0],
      });
      await new Array(9)
        .fill(0)
        .reduce(
          (promises, _, i) =>
            promises.then(() =>
              this.mockERC20.transfer(accounts[i + 1], "1000" + e18, {
                from: accounts[0],
              })
            ),
          Promise.resolve()
        );

        
      await new Array(9)
        .fill(0)
        .reduce(
          (promises, _, i) =>
            promises.then(() =>
              this.mockERC20.approve(this.lootbox.address, "1000" + e18, {
                from: accounts[i + 1],
              })
            ),
          Promise.resolve()
        );

        const getSampleBounty = () => ({
          availableQty: 33,
          nfTokens: [1,2,3],
          nftTokensQty: [1,1,1],
          prize: 10000
        });

        var bounty = [{availableQty: 33,nfTokens: [1,1,3],nftTokensQty: [1,1,1],prize: 10000}]

        this.sampleBounty = getSampleBounty();
      await this.claimBounty.addBounty(bounty);

    });


    it("should set correct state variables", async () => {
        const erc1155 = await this.lootbox.erc1155();
        const treasury = await this.lootbox.treasury();
        assert.equal(erc1155, this.kingERC1155.address);
        assert.equal(treasury.valueOf(), accounts[0]);
      });

      it("Try Open Lootbox and receive ERC1155 Randomly", async () => {
        await this.lootbox.openTwenty(accounts[1], { from: accounts[0] });
        var i;
        var count = 0;
        var total = 0;
        var rtotal = 0;
        var ctotal = 0;
        var ltotal = 0;
        for (i = 0; i <= 60; i++) {
          var bal = await this.kingERC1155.balanceOf(accounts[0], i);
          if(bal > 0){
            total = total + bal;
          }
         
          if(count==1){
            console.log("Balance of ID : " + i + " = " + bal + " Common");
            if(bal > 0){
              ctotal= ctotal + bal;
            }
          }
          if(count==2){
            console.log("Balance of ID : " + i + " = " + bal + " RARE");
            if(bal > 0){
              rtotal= rtotal + bal;
            }
          }
          if(count==3){
            console.log("Balance of ID : " + i + " = " + bal + " LEGENDARY");
            count = 0;
            if(bal > 0){
              ltotal = ltotal + bal;
            }
          }
          count++;
        }
        console.log("Total :" + total);
        console.log("Total Common: " + ctotal);
        console.log("Total Rare: " + rtotal);
        console.log("Total Legendary: " + ltotal);
        });

        it("claiming Bounty", async () => {
          var nftIds = [1,2,3];
          var nftQty = [10,10,10];
          var nftQtyToClaim = [1,1,1];
          await this.kingERC1155.mintBatch(accounts[1],nftIds,nftQty,{ from: accounts[0] });
          await this.claimBounty.claim(1,nftIds,nftQtyToClaim,{ from: accounts[1] });

          assert.equal(await this.kingERC1155.balanceOf(accounts[1],1).valueOf(), '9');
          assert.equal(await this.kingERC1155.balanceOf(accounts[1],2).valueOf(), '9');
          assert.equal(await this.kingERC1155.balanceOf(accounts[1],3).valueOf(), '9');
          console.log("Balance of Account[1] :" + await this.mockERC20.balanceOf(accounts[1]).valueOf());
          assert.equal(await this.mockERC20.balanceOf(accounts[1]).valueOf(), ':1000000000000000010000');

        });




})