package com.it.melody.mapper;

import com.it.melody.pojo.Login;
import com.it.melody.pojo.Songs;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface UserMapper {


    List<Songs> getLikedSongsById(int id);

    Login getUserByNameAndPassword(String username, String password);

    void addUser(String username, String password);

    void addFavoriteById(int id, int songId);

    void deleteFavoriteById(int id, int songId);

    List<Songs> getAllLikedSongsById(int id);
}
